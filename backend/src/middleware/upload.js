import multer from 'multer';
import path from 'path';
import { createError } from '../utils/create-error.js';

const storage = multer.memoryStorage();
const allowedTypes = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']);

const fileFilter = (_req, file, callback) => {
  if (!allowedTypes.has(file.mimetype)) {
    callback(createError(400, 'Only PNG, JPEG, WEBP, and SVG uploads are allowed'));
    return;
  }

  const extension = path.extname(file.originalname).toLowerCase();
  if (!['.png', '.jpg', '.jpeg', '.webp', '.svg'].includes(extension)) {
    callback(createError(400, 'Invalid image file extension'));
    return;
  }

  callback(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 8 * 1024 * 1024
  }
});
