const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080';

export async function getPosts() {
  const res = await fetch(`${API_BASE_URL}/api/posts`, {
    method: 'GET',
    credentials: 'include',
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw { status: res.status, data };
  }

  return data || [];
}

export async function createPost(formData, csrf) {
  const headers = {};

  if (csrf) {
    headers['X-CSRF-Token'] = csrf;
  }

  const res = await fetch(`${API_BASE_URL}/api/posts`, {
    method: 'POST',
    headers,
    body: formData,
    credentials: 'include',
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    console.error('createPost error', res.status, data);
    throw { status: res.status, data };
  }

  return data;
}

export async function updatePost(postId, formData) {
  const res = await fetch(`${API_BASE_URL}/api/posts/${postId}`, {
    method: 'PUT',
    body: formData,
    credentials: 'include',
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw { status: res.status, data };
  }

  return data;
}
