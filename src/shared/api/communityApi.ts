import { api, API_BASE_URL } from './client';

export const UPLOADS_BASE = `${API_BASE_URL}/uploads/`;

export type CommunityId = number;

export type ToggleSubscriptionResponse = {
  isSubscribed: boolean;
};

export type Pagination = {
  page?: number;
  limit?: number;
};

export type SearchCommunitiesParams = {
  name: string;
  type?: string;
  page?: number;
  limit?: number;
};

function assertId(value: unknown, fnName: string): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new Error(`${fnName}: id is required`);
  }
}

function assertFormData(value: unknown, fnName: string): asserts value is FormData {
  if (!(value instanceof FormData)) {
    throw new Error(`${fnName}: body must be FormData`);
  }
}

function normalizeArray<T>(data: unknown): T[] {
  return Array.isArray(data) ? (data as T[]) : [];
}

export async function getCommunity<T = unknown>(id: CommunityId): Promise<T> {
  assertId(id, 'getCommunity');
  return api<T>(`/api/communities/${id}`, { method: 'GET' });
}

export async function getCommunityPosts<T = unknown>(
  communityId: CommunityId,
  page = 1,
  limit = 20,
): Promise<T> {
  assertId(communityId, 'getCommunityPosts');
  const url = `/api/communities/${communityId}/posts?page=${encodeURIComponent(
    page,
  )}&limit=${encodeURIComponent(limit)}`;
  return api<T>(url, { method: 'GET' });
}

export async function getCommunitySubscribers<T = unknown>(
  communityId: CommunityId,
  limit = 4,
): Promise<T> {
  assertId(communityId, 'getCommunitySubscribers');
  const url = `/api/communities/${communityId}/subscribers?limit=${encodeURIComponent(limit)}`;
  return api<T>(url, { method: 'GET' });
}

export async function createCommunity<T = unknown>(formData: FormData): Promise<T> {
  assertFormData(formData, 'createCommunity');
  return api<T>('/api/communities', { method: 'POST', body: formData });
}

export async function updateCommunity<T = unknown>(
  communityId: CommunityId,
  formData: FormData,
): Promise<T> {
  assertId(communityId, 'updateCommunity');
  assertFormData(formData, 'updateCommunity');
  return api<T>(`/api/communities/${communityId}`, { method: 'PUT', body: formData });
}

export async function deleteCommunity(communityId: CommunityId): Promise<{ ok: true }> {
  assertId(communityId, 'deleteCommunity');
  await api(`/api/communities/${communityId}`, { method: 'DELETE' });
  return { ok: true };
}

export async function subscribeCommunity<T = unknown>(communityId: CommunityId): Promise<T> {
  assertId(communityId, 'subscribeCommunity');
  return api<T>(`/api/communities/${communityId}/subscribe`, { method: 'POST' });
}

export async function unsubscribeCommunity<T = unknown>(communityId: CommunityId): Promise<T> {
  assertId(communityId, 'unsubscribeCommunity');
  return api<T>(`/api/communities/${communityId}/unsubscribe`, { method: 'POST' });
}

export async function toggleCommunitySubscription(
  communityId: CommunityId,
  isSubscribed: boolean,
): Promise<ToggleSubscriptionResponse> {
  assertId(communityId, 'toggleCommunitySubscription');

  if (isSubscribed) {
    await unsubscribeCommunity(communityId);
    return { isSubscribed: false };
  }

  await subscribeCommunity(communityId);
  return { isSubscribed: true };
}

export async function getMyCommunities<T = unknown>(
  page = 1,
  limit = 20,
): Promise<T[]> {
  const data = await api<unknown>(
    `/api/communities/my?page=${encodeURIComponent(page)}&limit=${encodeURIComponent(limit)}`,
    { method: 'GET' },
  );
  return normalizeArray<T>(data);
}

export async function getOtherCommunities<T = unknown>(
  page = 1,
  limit = 20,
): Promise<T[]> {
  const data = await api<unknown>(
    `/api/communities/other?page=${encodeURIComponent(page)}&limit=${encodeURIComponent(limit)}`,
    { method: 'GET' },
  );
  return normalizeArray<T>(data);
}

export async function getCreatedCommunities<T = unknown>(
  page = 1,
  limit = 20,
): Promise<T[]> {
  const data = await api<unknown>(
    `/api/communities/created?page=${encodeURIComponent(page)}&limit=${encodeURIComponent(limit)}`,
    { method: 'GET' },
  );
  return normalizeArray<T>(data);
}

export async function getUserCommunities<T = unknown>(
  userId: number,
  page = 1,
  limit = 20,
): Promise<T[]> {
  assertId(userId, 'getUserCommunities');
  const data = await api<unknown>(
    `/api/communities/users/${encodeURIComponent(userId)}?page=${encodeURIComponent(
      page,
    )}&limit=${encodeURIComponent(limit)}`,
    { method: 'GET' },
  );
  return normalizeArray<T>(data);
}

export async function searchCommunities<T = unknown>({
  name,
  type,
  page = 1,
  limit = 20,
}: SearchCommunitiesParams): Promise<T[]> {
  if (!name) throw new Error('searchCommunities: name is required');

  const params = new URLSearchParams();
  params.set('name', name);
  if (type) params.set('type', type);
  if (page != null) params.set('page', String(page));
  if (limit != null) params.set('limit', String(limit));

  const data = await api<unknown>(`/api/communities/search?${params.toString()}`, {
    method: 'GET',
  });

  return normalizeArray<T>(data);
}
