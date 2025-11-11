// src/shared/api/friendsApi.js
import { api, API_BASE_URL } from './client.js';

// GET /api/friends/requests
export async function getFriendRequests(page = 1, limit = 20) {
  const data = await api(`/api/friends/requests?page=${page}&limit=${limit}`, {
    method: 'GET',
  });

  // у тебя раньше было: вернуть массив
  return Array.isArray(data) ? data : data.requests || [];
}

// GET /api/friends
export async function getFriends(page = 1, limit = 20) {
  const data = await api(`/api/friends?page=${page}&limit=${limit}`, {
    method: 'GET',
  });
  return Array.isArray(data) ? data : data.friends || [];
}

// GET /api/friends/users/all
export async function getPossibleFriends(page = 1, limit = 20) {
  const data = await api(`/api/friends/users/all?page=${page}&limit=${limit}`, {
    method: 'GET',
  });
  return Array.isArray(data) ? data : [];
}

// вот эти четыре у тебя, судя по ошибкам, где-то ожидаются как "возвращает Response"
// поэтому оставим прямой fetch чтобы не ломать старый код

export async function deleteFriend(userId, csrf) {
  return fetch(`${API_BASE_URL}/api/friends/${userId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
    },
    credentials: 'include',
  });
}

export async function acceptFriend(userId, csrf) {
  return fetch(`${API_BASE_URL}/api/friends/${userId}/accept`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
    },
    credentials: 'include',
  });
}

export async function sendFriendRequest(userId, csrf) {
  return fetch(`${API_BASE_URL}/api/friends/${userId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
    },
    credentials: 'include',
  });
}
