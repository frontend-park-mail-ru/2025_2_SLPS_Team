
let mockCommunity = {
  id: 1,
  name: 'VK Education',
  description:
    'Образовательный проект VKОбразовательный проект VKОбразовательный проект VKОбразовательный проект VKОбразовательный проект',
  subscribersCount: 254400,          
  createdAt: '2025-11-16T00:00:00Z',  
  ownerId: 1,                        // Поменяй id на свой чтобы смотреть от лица админа
  isSubscribed: false,               // состояние подписки
  avatarPath: '/public/testData/groupim2.jpg',                  // чето не работает
  coverPath: null,                   // обложка
};

let mockPosts = [];

let mockSubscribers = [
  {
    id: 10,
    fullName: 'Павловский Роман',
    avatarPath: null,
  },
  {
    id: 11,
    fullName: 'Иванова Анна',
    avatarPath: null,
  },
  {
    id: 12,
    fullName: 'Сергеев Дмитрий',
    avatarPath: null,
  },
];


export async function getCommunity(id) {
  return { ...mockCommunity, id };
}

export async function getCommunityPosts(communityId, limit = 20) {
  return mockPosts.slice(0, limit);
}

export async function getCommunitySubscribers(communityId, limit = 5) {
  return mockSubscribers.slice(0, limit);
}

export async function toggleCommunitySubscription(communityId, csrfToken) {
  mockCommunity.isSubscribed = !mockCommunity.isSubscribed;
  return { isSubscribed: mockCommunity.isSubscribed };
}


export async function deleteCommunity(communityId, csrfToken) {
  console.log('[mock communityApi] deleteCommunity', communityId);
  return { ok: true };
}


export async function updateCommunity(communityId, formData) {
  if (!communityId) {
    throw new Error('updateCommunity: communityId is required');
  }

  const baseUrl = process.env.API_BASE_URL || '';

  const url = `${baseUrl}/api/communities/${communityId}`;

  const response = await fetch(url, {
    method: 'PUT',          // или 'PATCH'
    body: formData,         // FormData: name, description, avatar/avatarDelete
    credentials: 'include', // чтобы куки/сессия поехали
  });

  if (!response.ok) {
    let message = `updateCommunity: ${response.status} ${response.statusText}`;
    try {
      const text = await response.text();
      if (text) {
        message += ` — ${text}`;
      }
    } catch (_) {
      // ignore
    }
    throw new Error(message);
  }

  // если бек что-то возвращает (обновлённое сообщество) — парсим,
  // если нет — можно вернуть null
  try {
    return await response.json();
  } catch (_) {
    return null;
  }
}
