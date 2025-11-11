import { api, apiRaw } from './client.js';

export function getProfile(userId) {
  return api(`/api/profile/${userId}`);
}

export function getUserPosts(userId, limit = 20) {
  return api(`/api/users/${userId}/posts?limit=${limit}`);
}

export function getProfileFriendStatus(userId) {
  return api(`/api/friends/${userId}/status`).then((data) => data.status);
}

export function sendProfileFriendRequest(userId, csrf) {
  return apiRaw(`/api/friends/${userId}`, {
    method: 'POST',
    headers: csrf ? { 'X-CSRF-Token': csrf } : {},
  });
}

export function openChatWithUser(userId) {
  return api(`/api/chats/user/${userId}`);
}

export function updateProfile(formData) {
  return api('/api/profile', {
    method: 'PUT',
    body: formData,
  });
}

export function deleteProfileAvatar() {
  return apiRaw('/api/profile/avatar', {
    method: 'DELETE',
  });
}