import CommunitySubscriberRowTemplate from './CommunitySubscriberRow.hbs';
import './CommunitySubscriberRow.css';

/**
 * Рендер одной строки подписчика сообщества.
 *
 * @param {Object} params
 * @param {number} params.id
 * @param {string} params.fullName
 * @param {string} params.avatarPath
 * @param {(id: number) => void} [params.onClick]
 * @returns {HTMLElement}
 */
export function renderCommunitySubscriberRow({
  id,
  fullName,
  avatarPath,
  onClick,
}) {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = CommunitySubscriberRowTemplate({
    id,
    fullName,
    avatarPath,
  });

  const root = wrapper.firstElementChild;

  if (onClick && root) {
    root.addEventListener('click', () => onClick(id));
  }

  return root;
}
