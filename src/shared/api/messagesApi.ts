import { api } from './client';
import type { ChatMessage } from '../types/components';

export interface GetChatMessagesResponse {
  messages: ChatMessage[];
  page: number;
  totalPages?: number;
}

export interface SendMessageResponse {
  id: number;
  text: string;
  chatID: number;
  authorID: number;
  createdAt: string;
}

export function getChatMessages(
  chatId: number,
  page: number = 1,
): Promise<GetChatMessagesResponse> {
  return api(`/api/chats/${chatId}/messages?page=${page}`, {
    method: 'GET',
  });
}

export function sendMessage(
  chatId: number,
  text: string,
): Promise<SendMessageResponse> {
  return api(`/api/chats/${chatId}/message`, {
    method: 'POST',
    body: { text },
  });
}
