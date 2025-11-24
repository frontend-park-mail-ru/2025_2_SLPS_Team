
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
  if (!communityId) {
    throw new Error('getCommunityPosts: communityId is required');
  }

  return api(
    `/api/communities/${communityId}/posts?limit=${encodeURIComponent(limit)}`,
    {
      method: 'GET',
    },
  );
}

export async function getCommunityPosts(communityId, limit = 20) {
  return mockPosts.slice(0, limit);
}

export async function getCommunitySubscribers(communityId, limit = 5) {
  return api(
    `/api/communities/${communityId}/subscribers?limit=${encodeURIComponent(
      limit,
    )}`,
    {
      method: 'GET',
    },
  );
}

export async function toggleCommunitySubscription(communityId) {
  if (!communityId) {
    throw new Error('toggleCommunitySubscription: communityId is required');
  }

  return api(`/api/communities/${communityId}/subscribe`, {
    method: 'POST',
  });
}


export async function deleteCommunity(communityId) {
  if (!communityId) {
    throw new Error('deleteCommunity: communityId is required');
  }

  await api(`/api/communities/${communityId}`, {
    method: 'DELETE',
  });

  return { ok: true };
}


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

export async function createCommunity(formData) {
  if (!(formData instanceof FormData)) {
    throw new Error('createCommunity: body must be FormData');
  }

  return api('/api/communities', {
    method: 'POST',
    body: formData,
  });
}

export async function getMyCommunities(page = 1, limit = 20) {
  const data = await api(
    `/api/communities/my?page=${encodeURIComponent(
      page,
    )}&limit=${encodeURIComponent(limit)}`,
    { method: 'GET' },
  );

  return Array.isArray(data) ? data : [];
}


export async function getOtherCommunities(page = 1, limit = 20) {
  const data = await api(
    `/api/communities/other?page=${encodeURIComponent(
      page,
    )}&limit=${encodeURIComponent(limit)}`,
    { method: 'GET' },
  );

  return Array.isArray(data) ? data : [];
}
