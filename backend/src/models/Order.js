import mongoose from 'mongoose';
import { randomBytes } from 'node:crypto';

const createTrackingId = () => {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = randomBytes(3).toString('hex').toUpperCase();
  return `TF-${datePart}-${randomPart}`;
};

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true },
    variant: {
      size: { type: String, required: true },
      color: { type: String, required: true }
    },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    previewUrl: { type: String, required: true },
    customization: {
      prompt: String,
      frontCanvas: Object,
      backCanvas: Object,
      printArea: Number
    }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    trackingId: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      default: createTrackingId
    },
    email: { type: String, required: true },
    items: [orderItemSchema],
    amountSubtotal: { type: Number, required: true },
    amountShipping: { type: Number, required: true },
    amountTax: { type: Number, required: true },
    amountTotal: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'paid', 'processing', 'fulfilled', 'cancelled'],
      default: 'pending'
    },
    offlineConfirmationTokenHash: { type: String, select: false },
    offlineConfirmationTokenExpiresAt: { type: Date, select: false },
    paymentIntentId: String,
    shippingAddress: {
      fullName: { type: String, required: true },
      line1: { type: String, required: true },
      line2: String,
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true }
    }
  },
  { timestamps: true }
);

orderSchema.pre('validate', function setTrackingId(next) {
  if (!this.trackingId) {
    this.trackingId = createTrackingId();
  }
  next();
});

export default mongoose.model('Order', orderSchema);
