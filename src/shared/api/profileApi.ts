import { api } from './client'; 
import type { FriendStatus } from '../types/friends';

export interface RelationsCount {
  countAccepted: number;
  countPending: number;
  countSent: number;
  CountBlocked: number;
}

export interface ProfileResponse {
  userID: number;
  firstName: string;
  lastName: string;
  fullName: string;

  avatarPath?: string | null;
  headerPath?: string | null;

  aboutMyself: string;
  gender: string;
  dob: string;

  relationsCount?: RelationsCount;
  relationStatus?: string;
}

export interface FriendStatusResponse {
  status?: string | null;
}

export interface PostEntity {
  id: number;
  text?: string;
  [key: string]: unknown;
}

export interface ChatEntity {
  id: number;
  [key: string]: unknown;
}

export function getProfile(userId: number): Promise<ProfileResponse> {
  return api<ProfileResponse>(`/api/profile/${userId}`, { method: 'GET' });
}

export function getUserPosts(
  userId: number,
  limit: number = 20,
): Promise<PostEntity[]> {
  return api<PostEntity[]>(`/api/users/${userId}/posts?limit=${limit}`, {
    method: 'GET',
  });
}

export async function getProfileFriendStatus(userId: number): Promise<FriendStatus> {
  const data = await api<FriendStatusResponse>(`/api/friends/${userId}/status`, { method: 'GET' });
  return (data?.status ?? 'none') as FriendStatus;
}

export function sendProfileFriendRequest(userId: number): Promise<unknown> {
  return api(`/api/friends/${userId}`, { method: 'POST' });
}

export function openChatWithUser(userId: number): Promise<ChatEntity> {
  return api<ChatEntity>(`/api/chats/user/${userId}`, { method: 'GET' });
}

export function updateProfile(formData: FormData): Promise<ProfileResponse> {
  return api<ProfileResponse>('/api/profile', {
    method: 'PUT',
    body: formData,
  });
}

export function deleteProfileAvatar(): Promise<unknown> {
  return api('/api/profile/avatar', { method: 'DELETE' });
}