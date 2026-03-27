import { v2 as cloudinary } from 'cloudinary';
import { createError } from '../utils/create-error.js';

let sharpLoader = null;

const getSharp = async () => {
  if (!sharpLoader) {
    sharpLoader = import('sharp')
      .then((module) => module.default || module)
      .catch(() => null);
  }
  return sharpLoader;
};

export const uploadImageBuffer = async (buffer, folder, mimeType = 'image/png') => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  const resolvedFolder =
    (typeof folder === 'string' ? folder.trim() : '') ||
    process.env.CLOUDINARY_UPLOAD_FOLDER?.trim() ||
    'ThreadForge-Studio';

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

  const sharp = await getSharp();

  let payloadBuffer = buffer;
  let payloadMimeType = mimeType || 'image/png';

  if (sharp) {
    payloadBuffer = await sharp(buffer)
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .png({ quality: 90 })
      .toBuffer();
    payloadMimeType = 'image/png';
  }

  const dataUri = `data:${payloadMimeType};base64,${payloadBuffer.toString('base64')}`;
  const uploaded = await cloudinary.uploader.upload(dataUri, {
    folder: resolvedFolder,
    resource_type: 'image'
  });

  return uploaded.secure_url;
};
