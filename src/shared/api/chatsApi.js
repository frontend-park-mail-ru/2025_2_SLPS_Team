import { api } from './client.js';

export function getChats(page = 1) {
  return api(`/api/chats?page=${page}`, {
    method: 'GET',
  });
}

export function getChatWithUser(userId) {
  return api(`/api/chats/user/${userId}`, {
    method: 'GET',
  });
}

export function getChatMessages(chatId, page = 100) {
  return api(`/api/chats/${chatId}/messages?page=${page}`, {
    method: 'GET',
  });
}

export function sendChatMessage(chatId, text) {
  return api(`/api/chats/${chatId}/message`, {
    method: 'POST',
    body: { text },
  });
}

export function updateChatReadState(chatId, lastReadMessageId) {
  return api(`/api/chats/${chatId}/last-read`, {
    method: 'PUT',
    body: { lastReadMessageID: lastReadMessageId },
  });
}
