const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080';

async function parseJsonSafe(res) {
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export async function getSupportRequests(page = 1, limit = 10) {
  const res = await fetch(
    `${API_BASE_URL}/api/support?page=${page}&limit=${limit}`,
    { credentials: 'include' }
  );

  const data = await parseJsonSafe(res);
  if (!res.ok) throw { status: res.status, data };

  if (Array.isArray(data)) {
    return { items: data, totalPages: 1 };
  }

  return {
    items: data.items || [],
    totalPages: data.totalPages || 1,
  };
}

export async function cancelSupportRequest(id, csrf) {
  return fetch(`${API_BASE_URL}/api/support/${id}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
    },
    credentials: 'include',
  });
}
