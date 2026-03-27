const configuredApiUrl = import.meta.env.VITE_API_URL;
const fallbackApiUrl = import.meta.env.PROD ? '' : 'http://localhost:5000/api';

function normalizeApiUrl(value) {
  if (!value) return value;

  const trimmed = value.trim().replace(/\/+$/, '');
  if (!trimmed) return trimmed;

  if (trimmed.endsWith('/api')) {
    return trimmed;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const url = new URL(trimmed);
      const pathname = url.pathname.replace(/\/+$/, '');
      if (!pathname || pathname === '/') {
        return `${trimmed}/api`;
      }
    } catch {
      // Fall through to return original value for non-standard URL values.
    }
  }

  return trimmed;
}

export const API_URL = normalizeApiUrl(configuredApiUrl) || fallbackApiUrl;

if (import.meta.env.PROD && !configuredApiUrl) {
  // Fail fast in production so a misconfigured deployment doesn't silently call localhost.
  throw new Error(
    'VITE_API_URL is required in production (set it in your Vercel Environment Variables).'
  );
}

export const AUTH_TOKEN_STORAGE_KEY = 'threadforge_auth_token';

export function getAuthToken() {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function setAuthToken(token) {
  if (typeof window === 'undefined') return;
  try {
    if (!token) {
      window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  } catch {
    // Ignore storage failures.
  }
}

function extractErrorMessage(body, fallback) {
  if (!body || typeof body !== 'object') return fallback;
  const baseMessage = typeof body.message === 'string' ? body.message : fallback;
  const details = body.details;

  const fieldErrors = details?.fieldErrors;
  if (fieldErrors && typeof fieldErrors === 'object') {
    const firstKey = Object.keys(fieldErrors)[0];
    const firstError = firstKey ? fieldErrors[firstKey]?.[0] : null;
    if (typeof firstError === 'string' && firstError.trim()) {
      return `${baseMessage}: ${firstError}`;
    }
  }

  return baseMessage;
}

export async function api(path, options = {}) {
  const authToken = getAuthToken();
  const hasAuthorizationHeader = Boolean(options.headers && Object.prototype.hasOwnProperty.call(options.headers, 'Authorization'));
  const isFormDataBody =
    typeof FormData !== 'undefined' && options.body && options.body instanceof FormData;
  const shouldSetJsonContentType = !isFormDataBody;

  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: {
      ...(shouldSetJsonContentType ? { 'Content-Type': 'application/json' } : {}),
      ...(authToken && !hasAuthorizationHeader ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(options.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    if (response.status === 401 && authToken) {
      setAuthToken('');
    }

    let message = 'Request failed';
    try {
      const body = await response.json();
      message = extractErrorMessage(body, message);
    } catch {
      // Ignore JSON parse failure and use fallback message.
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}
