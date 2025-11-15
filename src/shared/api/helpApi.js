// src/shared/api/helpApi.js
import { cachedFetch } from '../../services/CacheService.js';

const BASE_URL = process.env.API_BASE_URL || '';

/**
 * Маппинг категории из бекенда в человекочитаемый текст
 * (подправь под свои enum'ы, если они другие)
 */
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
    case 'friends_not_working':
      return 'Не работает страница друзья';
    case 'auth_problem':
      return 'Проблема с авторизацией/входом';
    default:
      return 'Без темы';
  }
}

/**
 * GET /applications?page=&limit=
 * Админу вернёт все заявки, обычному пользователю — только его.
 */
export async function getSupportRequests(page = 1, limit = 10) {
  const url = `${BASE_URL}/applications?page=${page}&limit=${limit}`;

  const res = await cachedFetch(url, {
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Failed to load applications');
  }

  const data = await res.json();

  // Бэк может вернуть просто массив или объект с полями items / applications
  const rawItems = Array.isArray(data)
    ? data
    : (data.items || data.applications || []);

  const totalPages =
    (!Array.isArray(data) && (data.totalPages || data.pages)) || 1;

  // Приводим к тому формату, который ждёт HelpPage
  const items = rawItems.map((app, index) => ({
    id: app.id,
    number: app.id ?? index + 1,
    topic: mapCategory(app.category),
    createdAt: app.createdAt,
    status: app.status,   // "open" | "in_progress" | "closed" | "canceled"
  }));

  return { items, totalPages };
}

/**
 * Отмена обращения
 * (подставь сюда тот эндпоинт, который у тебя реально есть для отмены)
 */
export async function cancelSupportRequest(id) {
  return fetch(`${BASE_URL}/applications/${id}/cancel`, {
    method: 'POST',
    credentials: 'include',
  });
}
