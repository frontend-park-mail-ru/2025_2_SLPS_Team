
let mockCommunity = {
  id: 1,
  name: 'VK Education',
  description:
    'Образовательный проект VKОбразовательный проект VKОбразовательный проект VKОбразовательный проект VKОбразовательный проект VKОбразовательный проект VKОбразовательный проект VKОбразовательный проект VKОбразовательный проект VKОбразовательный проект VKОбразовательный проект VKОбразовательный проект VKОбразовательный проект VKОбразовательный проект VK с возможностью развиваться и строить карьеру в IT-сфереSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS.',
  subscribersCount: 254400,          
  createdAt: '2025-011-16T00:00:00Z',
  ownerId: 5,                        // Поменяй id на свой чтобы смотреть от лица админа
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
