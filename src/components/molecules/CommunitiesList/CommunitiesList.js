import CommunitiesListTemplate from './CommunitiesList.hbs';
import {
  getUserCommunities,
  UPLOADS_BASE,
} from '../../../shared/api/communityApi.js';

const DEFAULT_AVATAR = '/public/globalImages/DefaultCommunity.svg';

function normalizeAvatar(avatarPath) {
  if (!avatarPath || avatarPath === 'null' || avatarPath === 'undefined') {
    return DEFAULT_AVATAR;
  }

  if (typeof avatarPath === 'string' && avatarPath.startsWith('http')) {
    return avatarPath;
  }

  return `${UPLOADS_BASE}${avatarPath}`;
}

export async function renderCommunitiesList(userId, limit = 4) {
  if (!userId) {
    console.warn('[CommunitiesList] userId is not provided');
    const wrapper = document.createElement('div');
    return wrapper;
  }

  let communitiesFromApi = [];

  try {
    communitiesFromApi = await getUserCommunities(userId, 1, limit);
  } catch (err) {
    console.error('[CommunitiesList] Failed to load communities:', err);
    communitiesFromApi = [];
  }

  const communities = (communitiesFromApi || [])
    .slice(0, limit)
    .map((c) => ({
      id: c.id,
      name: c.name,
      avatar: normalizeAvatar(c.avatarPath),
    }));

  const html = CommunitiesListTemplate({
    communities,
    count: communities.length,
  });

  const wrapper = document.createElement('div');
  wrapper.innerHTML = html.trim();

  return wrapper.firstElementChild;
}
