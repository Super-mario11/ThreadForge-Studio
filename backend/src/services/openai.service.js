import OpenAI from 'openai';
import { createError } from '../utils/create-error.js';

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export const generateImagesFromPrompt = async ({ prompt, size = '1024x1024' }) => {
  if (!client) {
    throw createError(500, 'OPENAI_API_KEY is not configured');
  }

  const response = await client.images.generate({
    model: 'gpt-image-1',
    prompt,
    size,
    n: 3,
    background: 'transparent'
  });

  return response.data.map((item) => `data:image/png;base64,${item.b64_json}`);
};
