import sharp from 'sharp';
import cloudinary from '../config/cloudinary.js';
import { createError } from '../utils/create-error.js';

export const uploadImageBuffer = async (buffer, folder = 'threadforge/uploads') => {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    throw createError(500, 'Cloudinary is not configured');
  }

  const optimizedBuffer = await sharp(buffer)
    .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
    .png({ quality: 90 })
    .toBuffer();

  const dataUri = `data:image/png;base64,${optimizedBuffer.toString('base64')}`;
  const uploaded = await cloudinary.uploader.upload(dataUri, {
    folder,
    resource_type: 'image'
  });

  return uploaded.secure_url;
};
