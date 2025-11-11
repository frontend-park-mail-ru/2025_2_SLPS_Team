// src/shared/api/client.js
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080';

function buildUrl(path) {
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path}`;
}

// базовая функция, как у тебя
export async function api(path, options = {}) {
  const url = buildUrl(path);

  const res = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw { status: res.status, data };
  }

  return data;
}

// добавляем удобный клиент, чтобы другие апишки могли его юзать
export const apiClient = {
  get: (path, options) => api(path, { method: 'GET', ...options }),
  post: (path, body, options) =>
    api(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),
  put: (path, body, options) =>
    api(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),
  delete: (path, options) => api(path, { method: 'DELETE', ...options }),
};

export { API_BASE_URL };
