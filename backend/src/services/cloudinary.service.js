import sharp from 'sharp';
import { v2 as cloudinary } from 'cloudinary';
import { createError } from '../utils/create-error.js';

export const uploadImageBuffer = async (buffer, folder = 'threadforge/uploads') => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloudName || !apiKey || !apiSecret) {
    throw createError(
      500,
      'Cloudinary is not configured (set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)'
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret
  });

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
