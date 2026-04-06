import { z } from 'zod';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { catalogProducts } from '../data/catalog.js';
import razorpay from '../config/razorpay.js';
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

const toMinorUnit = (amount) => Math.round(Number(amount || 0) * 100);

const secureCompareHex = (provided, expected) => {
  if (typeof provided !== 'string' || !provided || provided.length !== expected.length) {
    return false;
  }
  return timingSafeEqual(Buffer.from(provided, 'utf8'), Buffer.from(expected, 'utf8'));
};

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

const getRazorpayOrderForOrder = async (order) => {
  if (!razorpay || !process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw createError(503, 'Payments are not configured on the server');
  }

  if (!order.paymentProviderOrderId) {
    const razorpayOrder = await razorpay.orders.create({
      amount: toMinorUnit(order.amountTotal),
      currency: (process.env.RAZORPAY_CURRENCY || 'INR').toUpperCase(),
      receipt: String(order.trackingId || order._id).slice(0, 40),
      notes: {
        orderId: String(order._id),
        trackingId: order.trackingId,
        idempotencyKey: order.idempotencyKey || ''
      }
    });

    order.paymentProviderOrderId = razorpayOrder.id;
    await order.save();
    return razorpayOrder;
  }

  return {
    id: order.paymentProviderOrderId,
    amount: toMinorUnit(order.amountTotal),
    currency: (process.env.RAZORPAY_CURRENCY || 'INR').toUpperCase()
  };
};

export const createCheckoutSession = async (req, res) => {
  if (!razorpay || !process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw createError(503, 'Razorpay is not configured on the server');
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

    const razorpayOrder = await getRazorpayOrderForOrder(existingOrder);
    return res.json({
      orderId: existingOrder._id,
      trackingId: existingOrder.trackingId,
      lookupToken: existingOrder.lookupToken,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
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

  const razorpayOrder = await razorpay.orders.create({
    amount: toMinorUnit(total),
    currency: (process.env.RAZORPAY_CURRENCY || 'INR').toUpperCase(),
    receipt: String(order.trackingId || order._id).slice(0, 40),
    notes: {
      orderId: String(order._id),
      trackingId: order.trackingId,
      idempotencyKey
    }
  });

  order.paymentProviderOrderId = razorpayOrder.id;
  await order.save();

  return res.status(201).json({
    orderId: order._id,
    trackingId: order.trackingId,
    lookupToken: order.lookupToken,
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
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

const verifyPaymentSchema = z.object({
  orderId: z.string().min(1),
  lookupToken: z.string().min(1),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1)
});

export const verifyRazorpayPayment = async (req, res) => {
  if (!process.env.RAZORPAY_KEY_SECRET) {
    throw createError(503, 'Razorpay is not configured on the server');
  }

  const parsed = verifyPaymentSchema.safeParse(req.body);
  if (!parsed.success) {
    throw createError(400, 'Invalid payment verification payload', parsed.error.flatten());
  }

  const { orderId, lookupToken, razorpayOrderId, razorpayPaymentId, razorpaySignature } = parsed.data;
  const order = await Order.findById(orderId);

  if (!order) {
    throw createError(404, 'Order not found');
  }
  if (order.lookupToken !== lookupToken) {
    throw createError(403, 'Order access denied');
  }
  if (order.paymentProviderOrderId && order.paymentProviderOrderId !== razorpayOrderId) {
    throw createError(400, 'Payment order mismatch');
  }

  const expectedSignature = createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  if (!secureCompareHex(razorpaySignature, expectedSignature)) {
    throw createError(400, 'Invalid Razorpay signature');
  }

  if (order.status === 'paid') {
    return res.json({
      verified: true,
      status: order.status,
      orderId: order._id,
      trackingId: order.trackingId,
      lookupToken: order.lookupToken
    });
  }

  order.status = 'paid';
  order.paymentProviderOrderId = razorpayOrderId;
  order.paymentProviderPaymentId = razorpayPaymentId;
  await order.save();

  await sendOrderConfirmationEmail({
    to: order.email,
    trackingId: order.trackingId || buildFallbackTrackingId(order),
    total: order.amountTotal
  });

  return res.json({
    verified: true,
    status: order.status,
    orderId: order._id,
    trackingId: order.trackingId,
    lookupToken: order.lookupToken
  });
};

export const handleRazorpayWebhook = async (req, res) => {
  if (!process.env.RAZORPAY_WEBHOOK_SECRET || !process.env.RAZORPAY_KEY_SECRET) {
    return res.status(204).send();
  }

  const providedSignature = req.headers['x-razorpay-signature'];
  if (typeof providedSignature !== 'string' || !providedSignature.trim()) {
    throw createError(400, 'Missing Razorpay webhook signature');
  }

  const rawBody =
    Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}), 'utf8');
  const expectedSignature = createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  if (!secureCompareHex(providedSignature, expectedSignature)) {
    throw createError(400, 'Invalid webhook signature');
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString('utf8'));
  } catch {
    throw createError(400, 'Invalid webhook payload');
  }

  if (event.event === 'payment.captured') {
    const payment = event.payload?.payment?.entity;
    const orderRef = payment?.notes?.orderId;
    const order = orderRef
      ? await Order.findById(orderRef)
      : await Order.findOne({ paymentProviderOrderId: payment?.order_id });

    if (order && order.status === 'pending') {
      order.status = 'paid';
      order.paymentProviderOrderId = payment?.order_id || order.paymentProviderOrderId;
      order.paymentProviderPaymentId = payment?.id || order.paymentProviderPaymentId;
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
