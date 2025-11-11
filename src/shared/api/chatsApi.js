const API_BASE = process.env.API_BASE_URL;

export async function getChats(page = 1) {
  const res = await fetch(`${API_BASE}/api/chats?page=${page}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`getChats error: ${res.status}`);
  return res.json();
}

export async function getChatWithUser(userId) {
  const res = await fetch(`${API_BASE}/api/chats/user/${userId}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`getChatWithUser error: ${res.status}`);
  return res.json();
}
