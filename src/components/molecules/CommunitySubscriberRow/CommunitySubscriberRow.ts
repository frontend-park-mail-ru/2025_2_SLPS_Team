import CommunitySubscriberRowTemplate from './CommunitySubscriberRow.hbs';
import './CommunitySubscriberRow.css';

interface CommunitySubscriberRowProps {
  id: number;
  fullName: string;
  avatarPath: string;
  onClick?: (id: number) => void;
}

export function renderCommunitySubscriberRow({
  id,
  fullName,
  avatarPath,
  onClick,
}: CommunitySubscriberRowProps): HTMLElement | null {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = CommunitySubscriberRowTemplate({
    id,
    fullName,
    avatarPath,
  });

  const root = wrapper.firstElementChild as HTMLElement;

  if (onClick && root) {
    root.addEventListener('click', () => onClick(id));
  }

  return root;
}
