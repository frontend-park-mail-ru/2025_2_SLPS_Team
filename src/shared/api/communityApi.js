// src/shared/api/communityApi.js
import { api, API_BASE_URL } from './client.js';

const UPLOADS_BASE = `${API_BASE_URL}/uploads/`;
// Если где-то понадобится, можно импортировать UPLOADS_BASE из этого файла
export { UPLOADS_BASE };

/**
 * Получить одно сообщество по id
 * GET /communities/{id}
 */
export async function getCommunity(id) {
  if (!id) {
    throw new Error('getCommunity: id is required');
  }

  return api(`/api/communities/${id}`, {
    method: 'GET',
  });
}

/**
 * Посты сообщества
 * (если эндпоинт отличается — просто поправь URL)
 * GET /communities/{id}/posts?page=&limit=
 */
export async function getCommunityPosts(communityId, page = 1, limit = 20) {
  if (!communityId) {
    throw new Error('getCommunityPosts: communityId is required');
  }

  return api(
    `/api/communities/${communityId}/posts?page=${encodeURIComponent(
      page,
    )}&limit=${encodeURIComponent(limit)}`,
    {
      method: 'GET',
    },
  );
}

/**
 * Подписчики сообщества (правый блок на странице)
 * GET /communities/{id}/subscribers?limit=
 */
export async function getCommunitySubscribers(communityId, limit = 6) {
  if (!communityId) {
    throw new Error('getCommunitySubscribers: communityId is required');
  }

  return api(
    `/api/communities/${communityId}/subscribers?limit=${encodeURIComponent(
      limit,
    )}`,
    {
      method: 'GET',
    },
  );
}

/**
 * Создать сообщество
 * POST /communities
 * payload — FormData (name, description, avatar?, cover?)
 */
export async function createCommunity(formData) {
  if (!(formData instanceof FormData)) {
    throw new Error('createCommunity: body must be FormData');
  }

  return api('/api/communities', {
    method: 'POST',
    body: formData,
  });
}

/**
 * Обновить сообщество (редактирование)
 * PUT /communities/{id}
 * formData: name?/description?/avatar?/cover? и т.п.
 */
export async function updateCommunity(communityId, formData) {
  if (!communityId) {
    throw new Error('updateCommunity: communityId is required');
  }
  if (!(formData instanceof FormData)) {
    throw new Error('updateCommunity: body must be FormData');
  }

  return api(`/api/communities/${communityId}`, {
    method: 'PUT',
    body: formData,
  });
}

/**
 * Удалить сообщество
 * DELETE /communities/{id}
 */
export async function deleteCommunity(communityId) {
  if (!communityId) {
    throw new Error('deleteCommunity: communityId is required');
  }

  await api(`/api/communities/${communityId}`, {
    method: 'DELETE',
  });

  return { ok: true };
}

/**
 * Подписаться на сообщество
 * POST /communities/{id}/subscribe
 */
export async function subscribeCommunity(communityId) {
  if (!communityId) {
    throw new Error('subscribeCommunity: communityId is required');
  }

  return api(`/api/communities/${communityId}/subscribe`, {
    method: 'POST',
  });
}

/**
 * Отписаться от сообщества
 * POST /communities/{id}/unsubscribe
 */
export async function unsubscribeCommunity(communityId) {
  if (!communityId) {
    throw new Error('unsubscribeCommunity: communityId is required');
  }

  return api(`/api/communities/${communityId}/unsubscribe`, {
    method: 'POST',
  });
}

/**
 * Удобная обёртка: переключить подписку
 * На входе текущее состояние, внутри выбирается нужный эндпоинт
 */
export async function toggleCommunitySubscription(communityId, isSubscribed) {
  if (!communityId) {
    throw new Error('toggleCommunitySubscription: communityId is required');
  }

  if (isSubscribed) {
    await unsubscribeCommunity(communityId);
    return { isSubscribed: false };
  }

  await subscribeCommunity(communityId);
  return { isSubscribed: true };
}

/**
 * Список сообществ пользователя
 * GET /communities/my?page=&limit=
 */
export async function getMyCommunities(page = 1, limit = 20) {
  const data = await api(
    `/api/communities/my?page=${encodeURIComponent(
      page,
    )}&limit=${encodeURIComponent(limit)}`,
    {
      method: 'GET',
    },
  );

  return Array.isArray(data) ? data : [];
}

/**
 * Другие сообщества (рекомендации)
 * GET /communities/other?page=&limit=
 */
export async function getOtherCommunities(page = 1, limit = 20) {
  const data = await api(
    `/api/communities/other?page=${encodeURIComponent(
      page,
    )}&limit=${encodeURIComponent(limit)}`,
    {
      method: 'GET',
    },
  );

  return Array.isArray(data) ? data : [];
}
