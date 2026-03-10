import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const savedDesignSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    previewUrl: { type: String, required: true },
    productType: { type: String, required: true },
    color: { type: String, required: true },
    canvasState: { type: Object, required: true }
  },
  { timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String },
    provider: { type: String, enum: ['local', 'google'], default: 'local' },
    avatarUrl: { type: String },
    savedDesigns: [savedDesignSchema]
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  if (!this.password) {
    return false;
  }

  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
