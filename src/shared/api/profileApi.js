const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080';

async function parseJsonSafe(res) {
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export async function getProfile(userId) {
  const res = await fetch(`${API_BASE_URL}/api/profile/${userId}`, {
    credentials: 'include',
  });
  const data = await parseJsonSafe(res);
  if (!res.ok) throw { status: res.status, data };
  return data;
}

export async function getUserPosts(userId, limit = 20) {
  const res = await fetch(
    `${API_BASE_URL}/api/users/${userId}/posts?limit=${limit}`,
    { credentials: 'include' }
  );
  const data = await parseJsonSafe(res);
  if (!res.ok) throw { status: res.status, data };
  return data;
}

export async function getProfileFriendStatus(userId) {
  const res = await fetch(`${API_BASE_URL}/api/friends/${userId}/status`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'include',
  });
  const data = await parseJsonSafe(res);
  if (!res.ok) throw { status: res.status, data };
  return data.status;
}

export async function sendProfileFriendRequest(userId, csrf) {
  const res = await fetch(`${API_BASE_URL}/api/friends/${userId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
    },
    credentials: 'include',
  });
  return res;
}

export async function openChatWithUser(userId) {
  const res = await fetch(`${API_BASE_URL}/api/chats/user/${userId}`, {
    credentials: 'include',
  });
  const data = await parseJsonSafe(res);
  if (!res.ok) throw { status: res.status, data };
  return data;
}

export async function updateProfile(formData) {
  const res = await fetch(`${API_BASE_URL}/api/profile`, {
    method: 'PUT',
    body: formData,
    credentials: 'include',
  });
  const data = await parseJsonSafe(res);
  if (!res.ok) throw { status: res.status, data };
  return data;
}

export async function deleteProfileAvatar() {
  const res = await fetch(`${API_BASE_URL}/api/profile/avatar`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const data = await res.text();
    throw { status: res.status, data };
  }
}
