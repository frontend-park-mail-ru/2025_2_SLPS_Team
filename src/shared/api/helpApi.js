import { api, apiRaw } from './client.js';

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
  const data = await api(`/api/applications?page=${page}&limit=${limit}`, {
    method: 'GET',
  });

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
    status: app.status, // "open" | "in_progress" | "closed" | "canceled"
    text: app.text,
    full_name: app.fullName,
    emailFeedBack: app.emailFeedBack,
  }));

  return { items, totalPages };
}

export function cancelSupportRequest(id) {
  return apiRaw(`/api/applications/${id}/cancel`, {
    method: 'POST',
  });
}

export function createSupportRequest(payload) {
  return api('/api/applications', {
    method: 'POST',
    body: payload,
  });
}