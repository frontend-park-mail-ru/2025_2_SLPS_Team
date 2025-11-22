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