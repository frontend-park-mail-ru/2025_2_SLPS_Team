import { authService } from '../../services/AuthService.js';

const API_BASE_URL = process.env.API_BASE_URL

function buildUrl(path) {
  if (!path) {
    throw new Error('client: path is required');
  }

  if (path.startsWith('http')) return path;

  if (path.startsWith('/api')) return `${API_BASE_URL}${path}`;

  return path;
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
 * Базовый запрос
 *
 * @param {string} path - '/api/...' или полный URL
 * @param {object} options
 *   method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
 *   body: object (JSON) или FormData
 *   headers: доп. заголовки
 *   credentials: по умолчанию 'include'
 */
async function request(path, options = {}) {
  const url = buildUrl(path);
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body;
  const isFormData = body instanceof FormData;

  const headers = { ...(options.headers || {}) };

  if (!headers.Accept) {
    headers.Accept = 'application/json';
  }

  if (
    !isFormData &&
    body != null &&
    !headers['Content-Type'] &&
    method !== 'GET' &&
    method !== 'HEAD'
  ) {
    headers['Content-Type'] = 'application/json';
  }

  if (needsCsrf(method)) {
    const csrf = authService.getCsrfToken();
    if (csrf) {
      headers['X-CSRF-Token'] = csrf;
    }
  }

  const res = await fetch(url, {
    method,
    credentials: options.credentials || 'include',
    headers,
    body: isFormData
      ? body
      : body != null
      ? JSON.stringify(body)
      : undefined,
  });

  return res;
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
