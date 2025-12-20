import template from './HeaderCard.hbs';
import './HeaderCard.css';

import { toggleCommunitySubscription } from '../../../shared/api/communityApi';

export interface HeaderCardProps {
  coverPath?: string;
  avatarPath?: string;
  title?: string;
  subtitle?: string;

  isProfile?: boolean;
  isOwner?: boolean;

  showMoreButton?: boolean;
  showCancelRequest?: boolean;
  showMessage?: boolean;
  showAddFriend?: boolean;
  showBlocked?: boolean;

  isCommunity?: boolean;

  communityId?: number;
  isSubscribed?: boolean;
}

function setSubscribeText(btn: HTMLButtonElement, subscribed: boolean) {
  btn.textContent = subscribed ? 'Отписаться' : 'Подписаться';
}

export function renderHeaderCard(root: HTMLElement | null, props: HeaderCardProps): void {
  if (!root) return;

  root.innerHTML = template(props);

  if (!props.isCommunity || props.isOwner) return;

  const btn = root.querySelector('[data-role="subscribe-toggle"]') as HTMLButtonElement | null;
  if (!btn) return;

  const communityId = props.communityId;
  if (typeof communityId !== 'number') {
    console.warn('[HeaderCard] communityId is required');
    return;
  }

  let subscribed = !!props.isSubscribed;
  setSubscribeText(btn, subscribed);

  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (btn.disabled) return;

    btn.disabled = true;
    try {
      const res = await toggleCommunitySubscription(communityId, subscribed);
      subscribed = !!res.isSubscribed;
      setSubscribeText(btn, subscribed);
    } catch (err) {
      console.error('[HeaderCard] toggle subscribe error', err);
    } finally {
      btn.disabled = false;
    }
  });
}
