import mongoose from 'mongoose';

const generatedAssetSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    prompt: { type: String, required: true },
    images: [{ type: String, required: true }],
    provider: { type: String, default: 'openai' }
  },
  { timestamps: true }
);

export default mongoose.model('GeneratedAsset', generatedAssetSchema);
