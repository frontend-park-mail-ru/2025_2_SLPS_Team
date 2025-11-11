const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080';

async function parseJsonSafe(res) {
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export async function getFriendRequests(page = 1, limit = 20) {
  const res = await fetch(
    `${API_BASE_URL}/api/friends/requests?page=${page}&limit=${limit}`,
    { credentials: 'include' }
  );
  const data = await parseJsonSafe(res);
  if (!res.ok) throw { status: res.status, data };
  return Array.isArray(data) ? data : data.requests || [];
}

export async function getFriends(page = 1, limit = 20) {
  const res = await fetch(
    `${API_BASE_URL}/api/friends?page=${page}&limit=${limit}`,
    { credentials: 'include' }
  );
  const data = await parseJsonSafe(res);
  if (!res.ok) throw { status: res.status, data };
  return Array.isArray(data) ? data : (data.friends || []);
}

export async function getPossibleFriends(page = 1, limit = 20) {
  const res = await fetch(
    `${API_BASE_URL}/api/friends/users/all?page=${page}&limit=${limit}`,
    { credentials: 'include' }
  );
  const data = await parseJsonSafe(res);
  if (!res.ok) throw { status: res.status, data };
  return Array.isArray(data) ? data : [];
}

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
