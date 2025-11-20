import CommunityCardTemplate from './CommunityCard.hbs';
import './CommunityCard.css';

export function renderCommunityCard(context = {}) {
  const {
    id,
    name = 'Название сообщества',
    description = '',
    subscribers = '',
    avatarPath,
    isSubscribed = false,
    onClick,
    onToggleSubscribe,
  } = context;

  const baseUrl = `${process.env.API_BASE_URL}/uploads/`;

  let safeAvatarPath;
  if (!avatarPath || avatarPath === 'null') {
    safeAvatarPath = '/public/globalImages/DefaultCommunity.svg';
  } else if (avatarPath.startsWith('http') || avatarPath.startsWith('/public')) {
    safeAvatarPath = avatarPath;
  } else {
    safeAvatarPath = `${baseUrl}${avatarPath}`;
  }

  const wrapper = document.createElement('div');
  wrapper.innerHTML = CommunityCardTemplate({
    id,
    name,
    description,
    subscribers,
    avatarPath: safeAvatarPath,
    buttonText: isSubscribed ? 'Отписаться' : 'Подписаться',
  });

  const card = wrapper.firstElementChild;

  const mainContent = card.querySelector('.community-card__main-content');
  if (mainContent && onClick) {
    mainContent.addEventListener('click', (e) => {
      e.stopPropagation();
      onClick(id);
    });
  }

  const btn = card.querySelector('.community-card__btn');
  if (btn) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (onToggleSubscribe) {
        onToggleSubscribe(id);
      }
    });
  }

  return card;
}
