import { uploadImageBuffer } from '../services/cloudinary.service.js';
import { createError } from '../utils/create-error.js';
import { sanitizeSvgBuffer } from '../utils/sanitize-svg.js';

export const uploadImage = async (req, res) => {
  if (!req.file) {
    throw createError(400, 'Image file is required');
  }

  const isSvg = req.file.mimetype === 'image/svg+xml';
  const safeBuffer = isSvg ? sanitizeSvgBuffer(req.file.buffer) : req.file.buffer;

  const imageUrl = await uploadImageBuffer(safeBuffer, undefined, req.file.mimetype);
  res.status(201).json({ imageUrl });
};
