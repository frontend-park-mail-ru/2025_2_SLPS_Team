// components/molecules/HeaderCard/HeaderCard.js
import template from './HeaderCard.hbs';
import './HeaderCard.css'; // если есть, можно оставить пустым

export function renderHeaderCard(rootElement, props) {
  if (!rootElement) return;

  const html = template({
    coverPath: props.coverPath,
    avatarPath: props.avatarPath,
    title: props.title,
    subtitle: props.subtitle,

    isProfile: props.isProfile,
    isOwner: props.isOwner,
    showMoreButton: props.showMoreButton,
    showCancelRequest: props.showCancelRequest,
    showMessage: props.showMessage,
    showAddFriend: props.showAddFriend,
    showBlocked: props.showBlocked,

    isCommunity: props.isCommunity,
  });

  rootElement.innerHTML = html;
}
