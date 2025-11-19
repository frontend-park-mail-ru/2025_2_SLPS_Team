// src/shared/api/helpApi.js
import { cachedFetch } from '../../services/CacheService.js';

const BASE_URL = process.env.API_BASE_URL || '';

function mapCategory(category) {
  switch (category) {
    case 'app_freezing':
      return 'Приложение зависает/тормозит';
    case 'page_not_loading':
      return 'Не загружается страница';
    case 'chat_not_working':
      return 'Не работает чат';
    case 'profile_not_working':
      return 'Не работает профиль';
    case 'messenger_not_working':
      return 'Не работает мессенджер';
    case 'friend_not_working':
      return 'Не работает страница друзья';
    case 'auth_problem':
      return 'Проблема с авторизацией/входом';
    default:
      return 'Без темы';
  }
}


export async function getSupportRequests(page = 1, limit = 10) {
  const url = `${BASE_URL}/api/applications?page=${page}&limit=${limit}`;

  const res = await cachedFetch(url, {
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Failed to load applications');
  }

  const data = await res.json();

  const rawItems = Array.isArray(data)
    ? data
    : (data.items || data.applications || []);

  const totalPages =
    (!Array.isArray(data) && (data.totalPages || data.pages)) || 1;

  const items = rawItems.map((app, index) => ({
    id: app.id,
    number: app.id ?? index + 1,
    topic: mapCategory(app.category),
    createdAt: app.createdAt,
    status: app.status,   // "open" | "in_progress" | "closed" | "canceled"
    text: app.text,
    full_name: app.fullName,
    emailFeedBack: app.emailFeedBack,

  }));

  return { items, totalPages };
}

export async function cancelSupportRequest(id) {
  return fetch(`${BASE_URL}/applications/${id}/cancel`, {
    method: 'POST',
    credentials: 'include',
  });
}
