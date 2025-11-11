import { api, apiRaw } from './client.js';

export function getFriendRequests(page = 1, limit = 20) {
  return api(`/api/friends/requests?page=${page}&limit=${limit}`).then((data) =>
    Array.isArray(data) ? data : data.requests || []
  );
}

export function getFriends(page = 1, limit = 20) {
  return api(`/api/friends?page=${page}&limit=${limit}`).then((data) =>
    Array.isArray(data) ? data : data.friends || []
  );
}

export function getPossibleFriends(page = 1, limit = 20) {
  return api(`/api/friends/users/all?page=${page}&limit=${limit}`).then((data) =>
    Array.isArray(data) ? data : []
  );
}

export function deleteFriend(userId, csrf) {
  return apiRaw(`/api/friends/${userId}`, {
    method: 'DELETE',
    headers: csrf ? { 'X-CSRF-Token': csrf } : {},
  });
}

export function acceptFriend(userId, csrf) {
  return apiRaw(`/api/friends/${userId}/accept`, {
    method: 'PUT',
    headers: csrf ? { 'X-CSRF-Token': csrf } : {},
  });
}

export function sendFriendRequest(userId, csrf) {
  return apiRaw(`/api/friends/${userId}`, {
    method: 'POST',
    headers: csrf ? { 'X-CSRF-Token': csrf } : {},
  });
}