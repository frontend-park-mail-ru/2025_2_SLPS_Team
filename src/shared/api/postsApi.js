import { apiRaw } from './client.js';

export async function getPosts() {
  const res = await apiRaw('/api/posts', { method: 'GET' });
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

export async function getPostById(postId) {
  const res = await apiRaw(`/api/posts/${postId}`, {
    method: 'GET',
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    console.error('getPostById error', res.status, data);
    throw { status: res.status, data };
  }

  return data;
}

export async function getCommunityPosts(communityId, page = 1, limit = 20) {
  const res = await apiRaw(
    `/api/posts/communities/${communityId}?page=${page}&limit=${limit}`,
    {
      method: 'GET',
    },
  );

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    console.error('getCommunityPosts error', res.status, data);
    throw { status: res.status, data };
  }

  return Array.isArray(data) ? data : [];
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

/**
 * Удаление поста
 * DELETE /api/posts/{id}
 */
export async function deletePost(postId) {
  const res = await apiRaw(`/api/posts/${postId}`, {
    method: 'DELETE',
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    console.error('deletePost error', res.status, data);
    throw { status: res.status, data };
  }

  return data;
}

export async function togglePostLike(postId) {
  const res = await apiRaw(`/api/posts/${postId}/like`, {
    method: 'PUT',
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    console.error('togglePostLike error', res.status, data);
    throw { status: res.status, data };
  }

  return data;
}
