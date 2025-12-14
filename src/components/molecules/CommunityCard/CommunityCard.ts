import CommunityCardTemplate from './CommunityCard.hbs';
import './CommunityCard.css'
import BaseButton from '../../atoms/BaseButton/BaseButton';

interface CommunityCardContext {
  id?: number | string;
  name?: string;
  description?: string;
  subscribers?: string | number;
  avatarPath?: string;
  isSubscribed?: boolean;
  onClick?: (id: number | string) => void;
  onToggleSubscribe?: (id: number | string) => void;
  cardButton?: BaseButton;
}

export function renderCommunityCard(context: CommunityCardContext = {}): HTMLElement | null {
  const {
    id,
    name = 'Название сообщества',
    description = '',
    subscribers = '',
    avatarPath,
    isSubscribed = false,
    onClick,
    onToggleSubscribe,
    cardButton,
  } = context;

  if (!id) return null;

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
  });

  const card = wrapper.firstElementChild as HTMLElement;

  const mainContent = card.querySelector<HTMLElement>('.community-card__main-content');
  if (mainContent && onClick) {
    mainContent.addEventListener('click', (e) => {
      e.stopPropagation();
      onClick(id);
    });
  }

  const btnContainer = card.querySelector<HTMLElement>('.community-card__actions');
  if (btnContainer && onToggleSubscribe) {
      context.cardButton = new BaseButton(btnContainer, {
      text: isSubscribed ? 'Отписаться' : 'Подписаться',
      style: 'normal',
      onClick: () => onToggleSubscribe(id)}
    );
    context.cardButton.render();
  }
  return card;
}
