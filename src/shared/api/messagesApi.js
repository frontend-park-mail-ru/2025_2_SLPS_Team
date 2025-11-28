import { api } from './client.js';


export function getChatMessages(chatId, page = 1) {
  return api(`/api/chats/${chatId}/messages?page=${page}`, {
    method: 'GET',
  });
}

export function sendMessage(chatId, text) {
  return api(`/api/chats/${chatId}/message`, {
    method: 'POST',
    body: { text },
  });
}
