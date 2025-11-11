import { api } from './client.js';

export function getPosts() {
  return api('/api/posts').then((data) => data || []);
}

export function createPost(formData) {
  return api('/api/posts', {
    method: 'POST',
    body: formData,
  });
}

export function updatePost(postId, formData) {
  return api(`/api/posts/${postId}`, {
    method: 'PUT',
    body: formData,
  });
}