import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    category: {
      type: String,
      enum: ['Oversized T-Shirts', 'Regular Fit', 'Hoodies', 'Polo', 'Custom Collection'],
      required: true
    },
    description: { type: String, required: true },
    basePrice: { type: Number, required: true },
    colors: [{ type: String, required: true }],
    sizes: [{ type: String, required: true }],
    popularity: { type: Number, default: 0 },
    imageUrl: { type: String, required: true },
    featured: { type: Boolean, default: false },
    customizationAreas: {
      front: {
        width: Number,
        height: Number
      },
      back: {
        width: Number,
        height: Number
      }
    }
  },
  { timestamps: true }
);

export default mongoose.model('Product', productSchema);
