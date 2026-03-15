import GeneratedAsset from '../models/GeneratedAsset.js';
import { generateImagesFromPrompt } from '../services/huggingface.service.js';
import { createError } from '../utils/create-error.js';

export const generateDesign = async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || prompt.trim().length < 4) {
    throw createError(400, 'Prompt must be at least 4 characters');
  }

  const images = await generateImagesFromPrompt({ prompt: prompt.trim() });

  const asset = await GeneratedAsset.create({
    userId: req.user?._id,
    prompt: prompt.trim(),
    images
  });

  res.status(201).json({
    assetId: asset._id,
    images
  });
};
