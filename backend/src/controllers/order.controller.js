import { z } from 'zod';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
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

const fallbackProductsBySlug = new Map(
  catalogProducts.map((product) => [product.slug, product])
);
const OFFLINE_CONFIRMATION_TTL_MINUTES = Number.parseInt(
  process.env.OFFLINE_CONFIRMATION_TTL_MINUTES || '30',
  10
);
const OFFLINE_CONFIRMATION_TTL_MS =
  Number.isFinite(OFFLINE_CONFIRMATION_TTL_MINUTES) && OFFLINE_CONFIRMATION_TTL_MINUTES > 0
    ? OFFLINE_CONFIRMATION_TTL_MINUTES * 60 * 1000
    : 30 * 60 * 1000;

const sha256 = (value) => createHash('sha256').update(value).digest('hex');

const isValidOfflineToken = ({ providedToken, expectedHash }) => {
  if (!providedToken || !expectedHash) return false;

  const providedHash = sha256(providedToken);
  const providedBuffer = Buffer.from(providedHash, 'hex');
  const expectedBuffer = Buffer.from(expectedHash, 'hex');
  if (providedBuffer.length !== expectedBuffer.length) return false;

  return timingSafeEqual(providedBuffer, expectedBuffer);
};

const resolveCheckoutItems = async (items) => {
  const requestedIds = [...new Set(items.map((item) => item.productId))];
  const dbProducts = await Product.find({ _id: { $in: requestedIds } }).lean();
  const dbById = new Map(dbProducts.map((product) => [String(product._id), product]));

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

export const createCheckoutSession = async (req, res) => {
  const parsed = checkoutSchema.safeParse(req.body);
  if (!parsed.success) {
    throw createError(400, 'Invalid checkout payload', parsed.error.flatten());
  }

  const normalizedItems = await resolveCheckoutItems(parsed.data.items);
  const { subtotal, shipping, tax, total } = calculateCartTotals(normalizedItems);

  const order = await Order.create({
    userId: req.user?._id,
    email: parsed.data.email,
    items: normalizedItems,
    amountSubtotal: subtotal,
    amountShipping: shipping,
    amountTax: tax,
    amountTotal: total,
    shippingAddress: parsed.data.shippingAddress
  });

  if (!stripe || !process.env.STRIPE_SECRET_KEY) {
    const offlineConfirmationToken = randomBytes(24).toString('hex');
    order.offlineConfirmationTokenHash = sha256(offlineConfirmationToken);
    order.offlineConfirmationTokenExpiresAt = new Date(Date.now() + OFFLINE_CONFIRMATION_TTL_MS);
    await order.save();

    res.status(201).json({
      orderId: order._id,
      clientSecret: 'offline-demo',
      amountTotal: total,
      offlineConfirmationToken
    });
    return;
  }

  const paymentIntent = await stripe.paymentIntents.create({
    currency: process.env.STRIPE_CURRENCY || 'inr',
    amount: Math.round(total * 100),
    automatic_payment_methods: {
      enabled: true
    },
    metadata: {
      orderId: String(order._id)
    }
  });

  order.paymentIntentId = paymentIntent.id;
  await order.save();

  res.status(201).json({
    orderId: order._id,
    clientSecret: paymentIntent.client_secret,
    amountTotal: total
  });
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
    if (order && order.status !== 'paid') {
      order.status = 'paid';
      await order.save();
      await sendOrderConfirmationEmail({
        to: order.email,
        orderId: order._id,
        total: order.amountTotal
      });
    }
  }

  res.json({ received: true });
};

export const listMyOrders = async (req, res) => {
  const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json({ orders });
};

export const confirmOfflineOrder = async (req, res) => {
  const offlineAllowed =
    process.env.ALLOW_OFFLINE_PAYMENTS === 'true' || process.env.NODE_ENV !== 'production';

  if (!offlineAllowed) {
    throw createError(403, 'Offline payment confirmation is disabled');
  }

  const providedToken =
    typeof req.body?.offlineConfirmationToken === 'string'
      ? req.body.offlineConfirmationToken.trim()
      : '';

  if (!providedToken) {
    throw createError(401, 'Offline confirmation token is required');
  }

  const order = await Order.findById(req.params.orderId).select(
    '+offlineConfirmationTokenHash +offlineConfirmationTokenExpiresAt'
  );
  if (!order) {
    throw createError(404, 'Order not found');
  }

  if (!order.offlineConfirmationTokenHash || !order.offlineConfirmationTokenExpiresAt) {
    throw createError(401, 'Offline confirmation token is invalid');
  }

  if (order.offlineConfirmationTokenExpiresAt.getTime() < Date.now()) {
    throw createError(401, 'Offline confirmation token has expired');
  }

  if (
    !isValidOfflineToken({
      providedToken,
      expectedHash: order.offlineConfirmationTokenHash
    })
  ) {
    throw createError(401, 'Offline confirmation token is invalid');
  }

  if (order.status !== 'paid') {
    order.status = 'paid';
    order.offlineConfirmationTokenHash = undefined;
    order.offlineConfirmationTokenExpiresAt = undefined;
    await order.save();
    await sendOrderConfirmationEmail({
      to: order.email,
      orderId: order._id,
      total: order.amountTotal
    });
  }

  const safeOrder = await Order.findById(order._id);
  res.json({ order: safeOrder });
};
