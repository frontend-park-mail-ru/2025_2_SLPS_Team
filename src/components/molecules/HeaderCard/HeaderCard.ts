import template from './HeaderCard.hbs';
import './HeaderCard.css';

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
}

export function renderHeaderCard(root: HTMLElement | null, props: HeaderCardProps): void {
  if (!root) return;
  root.innerHTML = template(props);
}
