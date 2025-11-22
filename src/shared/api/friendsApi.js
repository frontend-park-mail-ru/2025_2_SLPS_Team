import { api, apiRaw } from './client.js';

export async function getFriendRequests(page = 1, limit = 20) {
  const data = await api(
    `/api/friends/requests?page=${page}&limit=${limit}`,
    { method: 'GET' },
  );

  return Array.isArray(data) ? data : data.requests || [];
}

export async function getFriends(page = 1, limit = 20) {
  const data = await api(
    `/api/friends?page=${page}&limit=${limit}`,
    { method: 'GET' },
  );

  return Array.isArray(data) ? data : data.friends || [];
}

export async function getPossibleFriends(page = 1, limit = 20) {
  const data = await api(
    `/api/friends/users/all?page=${page}&limit=${limit}`,
    { method: 'GET' },
  );

  return Array.isArray(data) ? data : [];
}

export function deleteFriend(userId, _csrf) {
  return apiRaw(`/api/friends/${userId}`, {
    method: 'DELETE',
  });
}

export async function getFriendsStats(userId) {
  try {
    const types = ['accepted', 'pending', 'sent'];
    const results = {};

    for (const type of types) {
      const data = await api(
        `/api/friends/${userId}/count?type=${type}`,
        { method: 'GET' },
      );

      results[type] = data?.count ?? 0;
    }

    return results;
  } catch (err) {
    console.error('[FriendsStats] Ошибка:', err);
    throw err;
  }
}

export function acceptFriend(userId, _csrf) {
  return apiRaw(`/api/friends/${userId}/accept`, {
    method: 'PUT',
  });
}


export function sendFriendRequest(userId, _csrf) {
  return apiRaw(`/api/friends/${userId}`, {
    method: 'POST',
  });
}
