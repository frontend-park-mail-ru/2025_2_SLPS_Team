const API_BASE = process.env.API_BASE_URL;

export async function getChatMessages(chatId, page = 1) {
  const res = await fetch(`${API_BASE}/api/chats/${chatId}/messages?page=${page}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`getChatMessages error: ${res.status}`);
  return res.json();
}

export async function sendMessage(chatId, text) {
  const res = await fetch(`${API_BASE}/api/chats/${chatId}/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`sendMessage error: ${res.status}`);
  return res.json();
}
