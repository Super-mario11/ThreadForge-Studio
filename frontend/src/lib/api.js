export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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

  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
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
