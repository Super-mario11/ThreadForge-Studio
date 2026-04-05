import { z } from 'zod';
import { createHash } from 'node:crypto';
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { catalogProducts } from '../data/catalog.js';
import stripe from '../config/stripe.js';
import { calculateCartTotals } from '../services/pricing.service.js';
import { sendOrderConfirmationEmail } from '../services/email.service.js';
import { createError } from '../utils/create-error.js';

const checkoutSchema = z.object({
  email: z.string().email(),
  items: z.array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().min(1),
      previewUrl: z.string().url(),
      variant: z.object({
        size: z.string(),
        color: z.string()
      }),
      customization: z.object({
        prompt: z.string().optional(),
        frontCanvas: z.any(),
        backCanvas: z.any(),
        printArea: z.number().optional()
      })
    })
  ),
  shippingAddress: z.object({
    fullName: z.string().min(2),
    line1: z.string().min(3),
    line2: z.string().optional(),
    city: z.string().min(2),
    state: z.string().min(2),
    postalCode: z.string().min(3),
    country: z.string().min(2)
  })
});

const quoteSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().min(1)
    })
  ),
  shippingAddress: z
    .object({
      state: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().optional()
    })
    .optional()
});

const fallbackProductsBySlug = new Map(catalogProducts.map((product) => [product.slug, product]));
const buildFallbackTrackingId = (order) => `TF-LEGACY-${String(order?._id || '').slice(-6).toUpperCase()}`;

const normalizeObject = (value) => {
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeObject(entry));
  }

  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = normalizeObject(value[key]);
        return acc;
      }, {});
  }

  return value;
};

const buildPayloadHash = (payload) =>
  createHash('sha256').update(JSON.stringify(normalizeObject(payload))).digest('hex');

const toOrderResponse = (order) => {
  const plainOrder = typeof order?.toObject === 'function' ? order.toObject() : order;
  return {
    ...plainOrder,
    trackingId: plainOrder?.trackingId || buildFallbackTrackingId(plainOrder)
  };
};

const loadProductsByRequestedIds = async (requestedIds) => {
  const objectIds = requestedIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
  if (!objectIds.length) {
    return new Map();
  }

  const dbProducts = await Product.find({ _id: { $in: objectIds } }).lean();
  return new Map(dbProducts.map((product) => [String(product._id), product]));
};

const resolveCheckoutItems = async (items) => {
  const requestedIds = [...new Set(items.map((item) => item.productId))];
  const dbById = await loadProductsByRequestedIds(requestedIds);

  return items.map((item) => {
    const product = dbById.get(item.productId) || fallbackProductsBySlug.get(item.productId);

    if (!product) {
      throw createError(400, `Product not found: ${item.productId}`);
    }

    return {
      productId: item.productId,
      name: product.name,
      quantity: item.quantity,
      unitPrice: product.basePrice,
      previewUrl: item.previewUrl,
      variant: item.variant,
      customization: item.customization
    };
  });
};

const resolveQuoteItems = async (items) => {
  const requestedIds = [...new Set(items.map((item) => item.productId))];
  const dbById = await loadProductsByRequestedIds(requestedIds);

  return items.map((item) => {
    const product = dbById.get(item.productId) || fallbackProductsBySlug.get(item.productId);
    if (!product) {
      throw createError(400, `Product not found: ${item.productId}`);
    }

    return {
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: product.basePrice
    };
  });
};

const readIdempotencyKey = (req) => {
  const headerValue = req.headers['idempotency-key'];
  if (typeof headerValue !== 'string') {
    throw createError(400, 'Idempotency-Key header is required');
  }

  const normalized = headerValue.trim();
  if (!normalized || normalized.length > 160) {
    throw createError(400, 'Invalid Idempotency-Key header');
  }

  return normalized;
};

const ensureOrderReadable = ({ req, order, lookupToken }) => {
  const isOwner =
    req.user?._id && order.userId && String(order.userId) === String(req.user._id);
  const tokenMatch = lookupToken && lookupToken === order.lookupToken;

  if (!isOwner && !tokenMatch) {
    throw createError(403, 'Order access denied');
  }
};

const getClientSecretForOrder = async (order) => {
  if (!stripe || !process.env.STRIPE_SECRET_KEY) {
    throw createError(503, 'Payments are not configured on the server');
  }

  if (!order.paymentIntentId) {
    const paymentIntent = await stripe.paymentIntents.create({
      currency: process.env.STRIPE_CURRENCY || 'inr',
      amount: Math.round(order.amountTotal * 100),
      automatic_payment_methods: {
        enabled: true
      },
      metadata: {
        orderId: String(order._id),
        trackingId: order.trackingId,
        idempotencyKey: order.idempotencyKey || ''
      }
    });

    order.paymentIntentId = paymentIntent.id;
    await order.save();
    return paymentIntent.client_secret;
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(order.paymentIntentId);
  return paymentIntent.client_secret;
};

export const createCheckoutSession = async (req, res) => {
  if (!stripe || !process.env.STRIPE_SECRET_KEY) {
    throw createError(503, 'Stripe is not configured on the server');
  }

  const idempotencyKey = readIdempotencyKey(req);
  const parsed = checkoutSchema.safeParse(req.body);
  if (!parsed.success) {
    throw createError(400, 'Invalid checkout payload', parsed.error.flatten());
  }

  const normalizedItems = await resolveCheckoutItems(parsed.data.items);
  const { subtotal, shipping, tax, total } = calculateCartTotals(normalizedItems, parsed.data.shippingAddress);

  const payloadHash = buildPayloadHash({
    email: parsed.data.email,
    items: normalizedItems,
    shippingAddress: parsed.data.shippingAddress,
    amountTotal: total
  });

  const existingOrder = await Order.findOne({ idempotencyKey });
  if (existingOrder) {
    if (existingOrder.idempotencyPayloadHash && existingOrder.idempotencyPayloadHash !== payloadHash) {
      throw createError(409, 'Idempotency key already used with different checkout data');
    }

    const clientSecret = await getClientSecretForOrder(existingOrder);
    return res.json({
      orderId: existingOrder._id,
      trackingId: existingOrder.trackingId,
      lookupToken: existingOrder.lookupToken,
      clientSecret,
      amountTotal: existingOrder.amountTotal,
      status: existingOrder.status
    });
  }

  const order = await Order.create({
    userId: req.user?._id,
    idempotencyKey,
    idempotencyPayloadHash: payloadHash,
    email: parsed.data.email,
    items: normalizedItems,
    amountSubtotal: subtotal,
    amountShipping: shipping,
    amountTax: tax,
    amountTotal: total,
    shippingAddress: parsed.data.shippingAddress
  });

  const paymentIntent = await stripe.paymentIntents.create(
    {
      currency: process.env.STRIPE_CURRENCY || 'inr',
      amount: Math.round(total * 100),
      automatic_payment_methods: {
        enabled: true
      },
      metadata: {
        orderId: String(order._id),
        trackingId: order.trackingId,
        idempotencyKey
      }
    },
    {
      idempotencyKey: `pi-${idempotencyKey}`
    }
  );

  order.paymentIntentId = paymentIntent.id;
  await order.save();

  return res.status(201).json({
    orderId: order._id,
    trackingId: order.trackingId,
    lookupToken: order.lookupToken,
    clientSecret: paymentIntent.client_secret,
    amountTotal: total,
    status: order.status
  });
};

export const getCheckoutQuote = async (req, res) => {
  const parsed = quoteSchema.safeParse(req.body);
  if (!parsed.success) {
    throw createError(400, 'Invalid quote payload', parsed.error.flatten());
  }

  const normalizedItems = await resolveQuoteItems(parsed.data.items);

  const totals = calculateCartTotals(normalizedItems, parsed.data.shippingAddress || {});
  res.json({ totals });
};

export const handleStripeWebhook = async (req, res) => {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET || !process.env.STRIPE_SECRET_KEY) {
    return res.status(204).send();
  }

  const signature = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const order = await Order.findOne({ paymentIntentId: paymentIntent.id });

    if (order && order.status === 'pending') {
      order.status = 'paid';
      await order.save();
      await sendOrderConfirmationEmail({
        to: order.email,
        trackingId: order.trackingId || buildFallbackTrackingId(order),
        total: order.amountTotal
      });
    }
  }

  res.json({ received: true });
};

export const listMyOrders = async (req, res) => {
  const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json({ orders: orders.map(toOrderResponse) });
};

export const getOrderById = async (req, res) => {
  const lookupToken = typeof req.query?.lookupToken === 'string' ? req.query.lookupToken.trim() : '';
  const order = await Order.findById(req.params.orderId);

  if (!order) {
    throw createError(404, 'Order not found');
  }

  ensureOrderReadable({ req, order, lookupToken });
  res.json({ order: toOrderResponse(order) });
};
