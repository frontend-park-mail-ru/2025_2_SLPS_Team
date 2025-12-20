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

function setSubscribeText(btn: HTMLButtonElement, isSubscribed: boolean) {
  btn.textContent = isSubscribed ? 'Отписаться' : 'Подписаться';
}

export function renderHeaderCard(root: HTMLElement | null, props: HeaderCardProps): void {
  if (!root) return;

  root.innerHTML = template(props);

  if (!props.isCommunity || props.isOwner) return;

  const btn = root.querySelector('[data-role="subscribe-toggle"]') as HTMLButtonElement | null;
  if (!btn) return;

  const communityId = props.communityId;
  if (typeof communityId !== 'number') {
    console.warn('[HeaderCard] communityId is required to toggle subscription');
    return;
  }

  let isSubscribed = !!props.isSubscribed;
  setSubscribeText(btn, isSubscribed);

  btn.addEventListener('click', async () => {
    if (btn.disabled) return;

    btn.disabled = true;
    try {
      const res = await toggleCommunitySubscription(communityId, isSubscribed);
      isSubscribed = !!res.isSubscribed;
      setSubscribeText(btn, isSubscribed);
    } catch (e) {
      console.error('[HeaderCard] toggle subscription failed', e);
    } finally {
      btn.disabled = false;
    }
  });
}
