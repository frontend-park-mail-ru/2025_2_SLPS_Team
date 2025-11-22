import { authService } from '../../services/AuthService.js';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080';

function buildUrl(path) {
  if (!path) {
    throw new Error('client: path is required');
  }  

  if (path.startsWith('http')) return path;

  if (path.startsWith('/api')) return `${API_BASE_URL}${path}`;

  return `${API_BASE_URL}/${path.replace(/^\/+/, '')}`;
}

async function parseJsonSafe(res) {
  const text = await res.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function needsCsrf(method) {
  const m = (method || 'GET').toUpperCase();
  return m === 'POST' || m === 'PUT' || m === 'PATCH' || m === 'DELETE';
}

/**
 *
 * @param {string} path - '/api/...' или полный URL
 * @param {object} options
 *   method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'...
 *   body: object (JSON) или FormData
 *   headers: доп. заголовки
 *   credentials: по умолчанию 'include'
 */
export async function api(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body;

  const isFormData = body instanceof FormData;

  const headers = new Headers(options.headers || {});

  if (!isFormData && body != null && !['GET', 'HEAD'].includes(method)) {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
  }

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrf = await authService.getCSRFToken().catch(() => null);
    if (csrf) headers.set('X-CSRF-Token', csrf);
  }

  const res = await fetch(url, {
    method,
    credentials: 'include',
    headers,
    body: isFormData
      ? body
      : body != null
      ? JSON.stringify(body)
      : undefined,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) throw { status: res.status, data };
  return data;
}

export async function api(path, options = {}) {
  const res = await request(path, options);
  const data = await parseJsonSafe(res);

  if (!res.ok) {
    throw { status: res.status, data };
  }

  return data;
}

export async function apiRaw(path, options = {}) {
  return request(path, options);
}

export { API_BASE_URL };
