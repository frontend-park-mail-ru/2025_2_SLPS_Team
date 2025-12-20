import { api } from './client';

export interface GetChatWithUserResponse {
  chatID: number;
}

export interface ChatMessage {
  id: number;
  authorID: number;
  chatID: number;
  text: string;
  createdAt: string;
  attachments?: string[];
}

export interface GetChatMessagesResponse {
  messages: ChatMessage[];
  page: number;
  totalPages?: number;
}

export interface SendMessageResponse {
  id: number;
  authorID: number;
  chatID: number;
  text: string;
  createdAt: string;
  attachments?: string[];
}

export function getChats(page: number = 1): Promise<unknown> {
  return api(`/api/chats?page=${page}`, { method: 'GET' });
}

export function getChatWithUser(userId: number): Promise<GetChatWithUserResponse> {
  return api(`/api/chats/user/${userId}`, { method: 'GET' });
}

export function getChatMessages(
  chatId: number,
  page: number = 1,
): Promise<GetChatMessagesResponse> {
  return api(`/api/chats/${chatId}/messages?page=${page}`, { method: 'GET' });
}

export async function sendChatMessage(
  chatId: number,
  text: string,
  files: File[],
  stickerId?: number,
) {
  const fd = new FormData();

  if (stickerId !== undefined) {
    fd.append('sticker_id', String(stickerId));
  } else {
    if (text) fd.append('text', text);
    for (const f of files) fd.append('attachments', f);
  }

  return api(`/api/chats/${chatId}/message`, {
    method: 'POST',
    body: fd,
  });
}

export function updateChatReadState(chatId: number, lastReadMessageId: number): Promise<void> {
  return api(`/api/chats/${chatId}/last-read`, {
    method: 'PUT',
    body: { lastReadMessageID: lastReadMessageId },
  });
}
