import CommunitiesListTemplate from './CommunitiesList.hbs';
import {
  getMyCommunities,
  UPLOADS_BASE,
} from '../../../shared/api/communityApi.js';

const DEFAULT_AVATAR = '/public/globalImages/DefaultCommunity.svg';

export async function renderCommunitiesList() {
  let communitiesFromApi = [];

  try {
    communitiesFromApi = await getMyCommunities(1, 4);
  } catch (err) {
    console.error('[CommunitiesList] Failed to load communities:', err);
    communitiesFromApi = [];
  }

  const communities = (communitiesFromApi || []).map((c) => ({
    id: c.id,
    name: c.name,
    avatar:
      c.avatarPath && c.avatarPath !== 'null'
        ? `${UPLOADS_BASE}${c.avatarPath}`
        : DEFAULT_AVATAR,
  }));

  const html = CommunitiesListTemplate({ communities });

  const wrapper = document.createElement('div');
  wrapper.innerHTML = html.trim();

  return wrapper.firstElementChild;
}
