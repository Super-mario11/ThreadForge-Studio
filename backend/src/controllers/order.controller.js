import { z } from 'zod';
import Order from '../models/Order.js';
import stripe from '../config/stripe.js';
import { calculateCartTotals } from '../services/pricing.service.js';
import { sendOrderConfirmationEmail } from '../services/email.service.js';
import { createError } from '../utils/create-error.js';

const checkoutSchema = z.object({
  email: z.string().email(),
  items: z.array(
    z.object({
      productId: z.string(),
      name: z.string(),
      quantity: z.number().int().min(1),
      unitPrice: z.number().positive(),
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

export const createCheckoutSession = async (req, res) => {
  const parsed = checkoutSchema.safeParse(req.body);
  if (!parsed.success) {
    throw createError(400, 'Invalid checkout payload', parsed.error.flatten());
  }

  const { subtotal, shipping, tax, total } = calculateCartTotals(parsed.data.items);

  const order = await Order.create({
    userId: req.user?._id,
    email: parsed.data.email,
    items: parsed.data.items,
    amountSubtotal: subtotal,
    amountShipping: shipping,
    amountTax: tax,
    amountTotal: total,
    shippingAddress: parsed.data.shippingAddress
  });

  if (!stripe || !process.env.STRIPE_SECRET_KEY) {
    res.status(201).json({
      orderId: order._id,
      clientSecret: 'offline-demo',
      amountTotal: total
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
    if (order) {
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
  const order = await Order.findById(req.params.orderId);
  if (!order) {
    throw createError(404, 'Order not found');
  }

  order.status = 'paid';
  await order.save();
  await sendOrderConfirmationEmail({
    to: order.email,
    orderId: order._id,
    total: order.amountTotal
  });

  res.json({ order });
};
