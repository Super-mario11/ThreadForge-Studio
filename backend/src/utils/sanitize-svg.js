import { createError } from './create-error.js';

const BLOCKED_TAGS = /<(script|foreignObject|iframe|object|embed|audio|video)\b/i;
const BLOCKED_ENTITIES = /<!ENTITY/i;
const EVENT_HANDLER_ATTRS = /\son[a-z]+\s*=\s*(['"]).*?\1/gi;
const JS_URL_ATTRS = /\s(?:href|xlink:href)\s*=\s*(['"])\s*javascript:[^'"]*\1/gi;

export const sanitizeSvgBuffer = (buffer) => {
  const source = buffer.toString('utf8');
  const trimmed = source.trim();

  if (!trimmed.startsWith('<svg') && !trimmed.startsWith('<?xml')) {
    throw createError(400, 'Invalid SVG file');
  }
  if (!/<svg[\s>]/i.test(trimmed)) {
    throw createError(400, 'Invalid SVG file');
  }

  if (BLOCKED_ENTITIES.test(trimmed) || BLOCKED_TAGS.test(trimmed)) {
    throw createError(400, 'Unsafe SVG content detected');
  }

  const withoutEventHandlers = trimmed.replace(EVENT_HANDLER_ATTRS, '');
  const sanitized = withoutEventHandlers.replace(JS_URL_ATTRS, '');

  if (BLOCKED_TAGS.test(sanitized)) {
    throw createError(400, 'Unsafe SVG content detected');
  }

  return Buffer.from(sanitized, 'utf8');
};
