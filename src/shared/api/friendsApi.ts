import { api, apiRaw } from './client';
import type { ProfileDTO, FriendsSearchBackendType } from '../types/friends';

interface Paginated<T> {
  items?: T[];
  friends?: T[];
  requests?: T[];
  count?: number;
}

export async function getFriendRequests(
  page = 1,
  limit = 20,
): Promise<ProfileDTO[]> {
  const data = await api<Paginated<ProfileDTO> | ProfileDTO[]>(
    `/api/friends/requests?page=${page}&limit=${limit}`,
  );

  if (Array.isArray(data)) return data;
  return data.requests ?? [];
}

export async function getFriends(
  page = 1,
  limit = 20,
): Promise<ProfileDTO[]> {
  const data = await api<Paginated<ProfileDTO> | ProfileDTO[]>(
    `/api/friends?page=${page}&limit=${limit}`,
  );

  if (Array.isArray(data)) return data;
  return data.friends ?? [];
}

export async function getPossibleFriends(
  page = 1,
  limit = 20,
): Promise<ProfileDTO[]> {
  const data = await api<ProfileDTO[]>(
    `/api/friends/users/all?page=${page}&limit=${limit}`,
  );

  return Array.isArray(data) ? data : [];
}

export function deleteFriend(userId: number): Promise<Response> {
  return apiRaw(`/api/friends/${userId}`, { method: 'DELETE' });
}

export function acceptFriend(userId: number): Promise<Response> {
  return apiRaw(`/api/friends/${userId}/accept`, { method: 'PUT' });
}
export async function rejectFriendRequest(id: number) {
  return apiRaw(`/friends/${id}/reject`, { method: 'PUT' });
}

export function sendFriendRequest(userId: number): Promise<Response> {
  return apiRaw(`/api/friends/${userId}`, { method: 'POST' });
}

export async function getFriendsStats(
  userId: number,
): Promise<Record<'accepted' | 'pending' | 'sent', number>> {
  const types: Array<'accepted' | 'pending' | 'sent'> = [
    'accepted',
    'pending',
    'sent',
  ];

  const result = {} as Record<'accepted' | 'pending' | 'sent', number>;

  for (const type of types) {
    const data = await api<{ count?: number }>(
      `/api/friends/${userId}/count?type=${type}`,
    );
    result[type] = data.count ?? 0;
  }

  return result;
}

export async function searchProfiles(
  fullName: string,
  type: FriendsSearchBackendType,
  page = 1,
  limit = 20,
): Promise<ProfileDTO[]> {
  const params = new URLSearchParams({
    full_name: fullName,
    type,
    page: String(page),
    limit: String(limit),
  });

  const data = await api<ProfileDTO[] | { items?: ProfileDTO[] }>(
    `/api/friends/search?${params.toString()}`,
  );

  if (Array.isArray(data)) return data;
  return data.items ?? [];
}
