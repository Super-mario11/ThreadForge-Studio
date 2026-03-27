import { uploadImageBuffer } from '../services/cloudinary.service.js';
import { createError } from '../utils/create-error.js';

export const uploadImage = async (req, res) => {
  if (!req.file) {
    throw createError(400, 'Image file is required');
  }

  const imageUrl = await uploadImageBuffer(req.file.buffer, undefined, req.file.mimetype);
  res.status(201).json({ imageUrl });
};
