import { api } from "./client.js";

export async function getChats(page = 1) {
  return api(`/api/chats?page=${page}`, {
    method: "GET",
  });
}

export async function getChatWithUser(userId) {
  return api(`/api/chats/user/${userId}`, {
    method: "GET",
  });
}
