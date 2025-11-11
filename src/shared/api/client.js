const API_BASE_URL = process.env.API_BASE_URL || '';

async function parseJsonSafe(res) {
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export async function api(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  const isFormData = options.body instanceof FormData;
  const res = await fetch(url, {
    method: options.method || 'GET',
    credentials: 'include',
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers || {}),
    },
    body: isFormData
      ? options.body
      : options.body
      ? JSON.stringify(options.body)
      : undefined,
  });
  const data = await parseJsonSafe(res);
  if (!res.ok) {
    throw { status: res.status, data };
  }
  return data;
}

export async function apiRaw(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  const isFormData = options.body instanceof FormData;
  const res = await fetch(url, {
    method: options.method || 'GET',
    credentials: 'include',
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers || {}),
    },
    body: isFormData
      ? options.body
      : options.body
      ? JSON.stringify(options.body)
      : undefined,
  });
  return res;
}


export { API_BASE_URL };
