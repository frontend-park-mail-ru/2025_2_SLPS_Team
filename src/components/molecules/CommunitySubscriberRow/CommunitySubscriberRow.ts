import CommunitySubscriberRowTemplate from './CommunitySubscriberRow.hbs';
import './CommunitySubscriberRow.css';

export type CommunitySubscriberRowProps = {
  id: number;
  fullName: string;
  avatarPath: string;
  onClick?: (id: number) => void;
};

export function renderCommunitySubscriberRow({
  id,
  fullName,
  avatarPath,
  onClick,
}: CommunitySubscriberRowProps): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = CommunitySubscriberRowTemplate({
    id,
    fullName,
    avatarPath,
  });

  const root = wrapper.firstElementChild;

  if (!(root instanceof HTMLElement)) {
    throw new Error('[CommunitySubscriberRow] Template root is missing');
  }

  if (onClick) {
    root.addEventListener('click', () => onClick(id));
  }

  return root;
}
