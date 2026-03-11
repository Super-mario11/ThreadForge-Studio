import OpenAI from 'openai';
import { createError } from '../utils/create-error.js';

export const generateImagesFromPrompt = async ({ prompt, size = '1024x1024' }) => {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw createError(500, 'OpenAI is not configured (set OPENAI_API_KEY)');
  }

  const client = new OpenAI({ apiKey });
  const response = await client.images.generate({
    model: 'gpt-image-1',
    prompt,
    size,
    n: 3,
    background: 'transparent'
  });

  return response.data.map((item) => `data:image/png;base64,${item.b64_json}`);
};
