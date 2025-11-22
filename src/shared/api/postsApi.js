import { apiRaw } from './client.js';

export async function getPosts() {
  const res = await apiRaw('/api/posts', { method: 'GET' });
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

export async function createPost(formData) {
  const res = await apiRaw('/api/posts', {
    method: 'POST',
    body: formData,
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
  const res = await apiRaw(`/api/posts/${postId}`, {
    method: 'PUT',
    body: formData,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw { status: res.status, data };
  }

  return data;
}
