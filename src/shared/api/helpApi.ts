import { api, apiRaw } from './client';


export type SupportCategory =
  | 'app_freezing'
  | 'page_not_loading'
  | 'chat_not_working'
  | 'profile_not_working'
  | 'messenger_not_working'
  | 'friend_not_working'
  | 'auth_problem'
  | string;

export interface SupportRequestRaw {
  id?: number;
  category?: SupportCategory;
  createdAt?: string;
  status?: string;
  text?: string;
  fullName?: string;
  emailFeedBack?: string;
}

export interface SupportRequestItem {
  id: number;
  number: number;
  topic: string;
  createdAt: string;
  status: string;
  text: string;
  full_name: string;
  emailFeedBack?: string;
}

export interface SupportListResponse {
  items: SupportRequestItem[];
  totalPages: number;
}

export interface CreateSupportRequestPayload {
  category: SupportCategory;
  text: string;
  emailFeedBack?: string;
}


function mapCategory(category?: SupportCategory): string {
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

/* ================= API ================= */

export async function getSupportRequests(
  page: number = 1,
  limit: number = 10,
): Promise<SupportListResponse> {
  // ⬇️ ВАЖНО: явно говорим TS, что data может быть ЛЮБЫМ
  const data: unknown = await api(
    `/api/applications?page=${page}&limit=${limit}`,
    { method: 'GET' },
  );

  if (!data) {
    console.warn('[getSupportRequests] Empty response');
    return { items: [], totalPages: 1 };
  }

  const obj = data as Record<string, unknown>;

  const rawItems: SupportRequestRaw[] = Array.isArray(obj)
    ? (obj as SupportRequestRaw[])
    : ((obj.items ?? obj.applications) as SupportRequestRaw[]) ?? [];

  const totalPages: number =
    typeof obj.totalPages === 'number'
      ? obj.totalPages
      : typeof obj.pages === 'number'
      ? obj.pages
      : 1;

  const items: SupportRequestItem[] = rawItems.map((app, index) => ({
    id: app.id ?? index + 1,
    number: app.id ?? index + 1,
    topic: mapCategory(app.category),
    createdAt: app.createdAt ?? '',
    status: app.status ?? '',
    text: app.text ?? '',
    full_name: app.fullName ?? '',
    emailFeedBack: app.emailFeedBack ?? '',
  }));


  return { items, totalPages };
}

export async function cancelSupportRequest(id: number): Promise<void> {
  await apiRaw(`/api/applications/${id}/cancel`, {
    method: 'POST',
  });
}

export async function createSupportRequest(
  payload: CreateSupportRequestPayload,
): Promise<void> {
  await api('/api/applications', {
    method: 'POST',
    body: payload,
  });
}
