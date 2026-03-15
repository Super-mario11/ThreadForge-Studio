import { createError } from '../utils/create-error.js';

const HF_BASE_URL = 'https://router.huggingface.co/hf-inference/models';
const DEFAULT_IMAGE_MODELS = [
  'stabilityai/stable-diffusion-xl-base-1.0',
  'black-forest-labs/FLUX.1-schnell',
  'runwayml/stable-diffusion-v1-5'
];
const DEFAULT_IMAGE_COUNT = 1;

const buildModelCandidates = () => {
  const configured = (process.env.HF_IMAGE_MODEL || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  return [...new Set([...configured, ...DEFAULT_IMAGE_MODELS])];
};

const resolveImageCount = () => {
  const raw = Number.parseInt(process.env.HF_IMAGE_COUNT || String(DEFAULT_IMAGE_COUNT), 10);
  if (!Number.isFinite(raw)) {
    return DEFAULT_IMAGE_COUNT;
  }

  return Math.max(1, Math.min(3, raw));
};

const parseErrorPayload = async (response) => {
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    const fallbackText = await response.text().catch(() => '');
    return fallbackText || `Request failed with status ${response.status}`;
  }

  const payload = await response.json().catch(() => null);
  return payload?.error || payload?.message || JSON.stringify(payload) || `Request failed with status ${response.status}`;
};

const createImageWithModel = async ({ token, model, prompt }) => {
  const endpoint = `${HF_BASE_URL}/${model}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      inputs: prompt,
      options: {
        wait_for_model: true
      }
    })
  });

  if (!response.ok) {
    const message = await parseErrorPayload(response);
    const error = new Error(message);
    error.status = response.status;
    error.model = model;
    throw error;
  }

  const mimeType = response.headers.get('content-type') || 'image/png';
  const buffer = Buffer.from(await response.arrayBuffer());

  if (!buffer.length) {
    const error = new Error('Provider returned an empty image');
    error.status = 502;
    error.model = model;
    throw error;
  }

  return `data:${mimeType};base64,${buffer.toString('base64')}`;
};

const shouldTryNextModel = (status) => {
  if (!status) return false;
  return status === 400 || status === 404 || status === 422 || status === 503;
};

export const generateImagesFromPrompt = async ({ prompt }) => {
  const token = process.env.HF_API_TOKEN?.trim();
  if (!token) {
    throw createError(500, 'Hugging Face is not configured (set HF_API_TOKEN)');
  }

  const modelCandidates = buildModelCandidates();
  const imageCount = resolveImageCount();

  let selectedModel = null;
  let firstImage = null;
  let lastError = null;

  for (const model of modelCandidates) {
    try {
      firstImage = await createImageWithModel({ token, model, prompt });
      selectedModel = model;
      break;
    } catch (error) {
      lastError = error;

      if (error?.status === 429 || error?.status === 402) {
        throw createError(
          429,
          'Hugging Face quota exceeded. Check your HF account credits or switch to a lower-cost image model.'
        );
      }

      if (!shouldTryNextModel(error?.status)) {
        throw createError(
          502,
          `Image generation failed (${error?.status || 500}) on ${error?.model || model}: ${error?.message || 'Unknown error'}`
        );
      }
    }
  }

  if (!selectedModel || !firstImage) {
    throw createError(
      502,
      `Image generation failed across models (${modelCandidates.join(', ')}). Last error: ${lastError?.message || 'Unknown error'}`
    );
  }

  const images = [firstImage];
  for (let index = 1; index < imageCount; index += 1) {
    const nextImage = await createImageWithModel({ token, model: selectedModel, prompt });
    images.push(nextImage);
  }

  return images;
};
