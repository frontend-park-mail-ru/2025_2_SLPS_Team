import CommunitiesListTemplate from './CommunitiesList.hbs';
import {
  getMyCommunities,
  UPLOADS_BASE,
} from '../../../shared/api/communityApi.js';

const DEFAULT_AVATAR = '/public/globalImages/DefaultCommunity.svg';

export async function renderCommunitiesList(limit = 4) {
  let communitiesFromApi = [];

  try {
    communitiesFromApi = await getMyCommunities(1, limit);
  } catch (err) {
    console.error('[CommunitiesList] Failed to load communities:', err);
    communitiesFromApi = [];
  }

  const communities = (communitiesFromApi || [])
    .slice(0, limit)
    .map((c) => ({
      id: c.id,
      name: c.name,
      avatar:
        c.avatarPath && c.avatarPath !== 'null'
          ? `${UPLOADS_BASE}${c.avatarPath}`
          : DEFAULT_AVATAR,
    }));

  const html = CommunitiesListTemplate({
    communities,
    count: communities.length,
  });

  const wrapper = document.createElement('div');
  wrapper.innerHTML = html.trim();

  return wrapper.firstElementChild;
}
