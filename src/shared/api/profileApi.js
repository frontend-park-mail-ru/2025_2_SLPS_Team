import { api } from './client.js';

export function getProfile(userId) {
  return api(`/api/profile/${userId}`, {
    method: 'GET',
  });
}

export function getUserPosts(userId, limit = 20) {
  return api(`/api/users/${userId}/posts?limit=${limit}`, {
    method: 'GET',
  });
}

export async function getProfileFriendStatus(userId) {
  const data = await api(`/api/friends/${userId}/status`, {
    method: 'GET',
  });
  return data?.status;
}

export function sendProfileFriendRequest(userId, _csrf) {
  return api(`/api/friends/${userId}`, {
    method: 'POST',
  });
}

export function openChatWithUser(userId) {
  return api(`/api/chats/user/${userId}`, {
    method: 'GET',
  });
}

export function updateProfile(formData) {
  return api('/api/profile', {
    method: 'PUT',
    body: formData,
  });
}

export function deleteProfileAvatar() {
  return api('/api/profile/avatar', {
    method: 'DELETE',
  });
}
