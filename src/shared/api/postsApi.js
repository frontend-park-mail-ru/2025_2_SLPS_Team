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

export async function createPost(formData) {
  const res = await fetch(`${API_BASE_URL}/api/posts`, {
    method: 'POST',
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
