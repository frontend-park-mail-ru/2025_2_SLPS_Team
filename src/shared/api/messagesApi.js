import { api } from "./client.js";

export async function getChatMessages(chatId, page = 1) {
  return api(`/api/chats/${chatId}/messages?page=${page}`, {
    method: "GET",
  });
}

export async function sendMessage(chatId, text) {
  return api(`/api/chats/${chatId}/message`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}
