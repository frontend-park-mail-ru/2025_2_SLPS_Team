import CommunitiesListTemplate from './CommunitiesList.hbs';
import {
  getUserCommunities,
  UPLOADS_BASE,
} from '../../../shared/api/communityApi';
import { navigateTo } from '../../../app/router/navigateTo';
import type { Community } from '@shared/types/components';

const DEFAULT_AVATAR = '/public/globalImages/DefaultAvatar.svg';

function normalizeAvatar(avatarPath: string | null | undefined): string {
  if (!avatarPath || avatarPath === 'null' || avatarPath === 'undefined') {
    return DEFAULT_AVATAR;
  }

  if (typeof avatarPath === 'string' && avatarPath.startsWith('http')) {
    return avatarPath;
  }

  return `${UPLOADS_BASE}${avatarPath}`;
}

export async function renderCommunitiesList(userId: number, limit = 4): Promise<HTMLElement>{
  if (!userId) {
    console.warn('[CommunitiesList] userId is not provided');
    const wrapper = document.createElement('div');
    return wrapper;
  }

  let communitiesFromApi: Array<{ id: number; name: string; avatarPath: string }> = [];

  try {
    communitiesFromApi = await getUserCommunities(userId, 1, limit);
  } catch (err) {
    console.error('[CommunitiesList] Failed to load communities:', err);
    communitiesFromApi = [];
  }

  const communities: Community[] = (communitiesFromApi || [])
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

  const root = wrapper.firstElementChild as HTMLElement;

  const items = root.querySelectorAll<HTMLElement>('.communities-list__item');

  items.forEach((item) => {
    const id = item.dataset.id;
    if (!id) return;

    item.style.cursor = 'pointer';

    item.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(`/community/${id}`);
    });
  });

  return root;
}
