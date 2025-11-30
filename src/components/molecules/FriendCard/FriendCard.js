import FriendCardTemplate from './FriendCard.hbs';
import DropDown from '../../atoms/dropDown/dropDown.js';
import BaseButton from '../../atoms/BaseButton/BaseButton.ts';
import { ModalConfirm } from '../ModalConfirm/ModalConfirm.js';
import { NotificationManager } from '../../organisms/NotificationsBlock/NotificationsManager.js';
import { authService } from '../../../services/AuthService.js';
import { navigateTo } from '../../../app/router/navigateTo.js';
import { deleteFriend, acceptFriend, sendFriendRequest} from '../../../shared/api/friendsApi.js';

import './FriendCard.css';

const notifier = new NotificationManager();

export function renderFriendCard(context = {}) {
  const {
    userID,
    name = 'Имя пользователя',
    age = 0,
    avatarPath,
    listType = 'friends',
  } = context;

  const isFriendsList = listType === 'friends';
  const isSubscribersList = listType === 'subscribers';
  const isPossibleList = listType === 'possible';

  const baseUrl = `${process.env.API_BASE_URL}/uploads/`;

  let safeAvatarPath;
  if (!avatarPath || avatarPath === 'null') {
    safeAvatarPath = `public/globalImages/DefaultAvatar.svg`;
  } else {
    safeAvatarPath = `${baseUrl}${avatarPath}`;
  }

  const wrapper = document.createElement('div');
  wrapper.innerHTML = FriendCardTemplate({
    userID,
    avatarPath: safeAvatarPath,
    name,
    age,
    isFriendsList,
    isSubscribersList,
  });

  const card = wrapper.firstElementChild;

  card
    .querySelector('.friend-card__main-content')
    .addEventListener('click', () => {
      navigateTo(`/profile/${userID}`);
    });

  if (isFriendsList) {
    const dropButton = wrapper.querySelector('.fiend-actions-button');
    const friendActionsConatiner = wrapper.querySelector('.friend-actions-container');

    const friendActions = new DropDown(friendActionsConatiner, {
      values: [
        {
          label: 'Удалить из друзей',
          icon: '/public/globalImages/DeleteImg.svg',
          onClick: () => {
            const blockConfirm = new ModalConfirm(
              'Подтвердите действие',
              `Вы уверены что хотите удалить пользователя ${name} из друзей?`,
              async () => {
                const res = await deleteFriend(userID, authService.getCsrfToken());
                if (res.ok) {
                  notifier.show(
                    'Пользователь удален',
                    `Вы удалили пользователя ${name} из друзей`,
                    'error'
                  );
                  navigateTo('/friends');
                } else {
                  notifier.show('Ошибка', 'Не удалось удалить из друзей', 'error');
                }
              }
            );
            blockConfirm.open();
          },
        },
        {
          label: 'Заблокировать',
          icon: '/public/FriendsActions/blockUser.svg',
          onClick: () => {
            const blockConfirm = new ModalConfirm(
              'Подтвердите действие',
              `Вы уверены что хотите заблокировать пользователя ${name}?`,
              () => {
                // тут  ручка на блок
                notifier.show('Пользователь заблокирован', '', 'error');
              }
            );
            blockConfirm.open();
          },
        },
      ],
    });

    friendActions.render();

    dropButton.addEventListener('mouseenter', () => friendActions.show());
    friendActions.wrapper.addEventListener('mouseenter', () => friendActions.show());

    dropButton.addEventListener('mouseleave', () => {
      setTimeout(() => {
        if (!friendActions.wrapper.matches(':hover')) friendActions.hide();
      }, 50);
    });
    friendActions.wrapper.addEventListener('mouseleave', () => friendActions.hide());
  }
  else if (isSubscribersList) {
    const buttonContainer = wrapper.querySelector('.freind-buttons-container');

    const acceptBtn = new BaseButton(buttonContainer, {
      text: 'Принять заявку',
      style: 'normal',
      onClick: async (e) => {
        e.stopPropagation();
        e.target.disabled = true;

        const res = await acceptFriend(userID, authService.getCsrfToken());
        if (res.ok) {
          notifier.show('Друг добавлен', `Вы добавили пользователя ${name} в друзья`, 'success');
          const textElement = document.createElement('span');
          textElement.classList.add('friend-status-text');
          textElement.textContent = 'В друзьях';
          e.target.replaceWith(textElement);
        } else {
          e.target.disabled = false;
          notifier.show('Ошибка', 'Не удалось принять заявку', 'error');
        }
      },
    });
    acceptBtn.render();
  }
  else if (isPossibleList) {
    const buttonContainer = wrapper.querySelector('.freind-buttons-container');

    const addBtn = new BaseButton(buttonContainer, {
      text: 'Добавить в друзья',
      style: 'normal',
      onClick: async (e) => {
        e.stopPropagation();
        const res = await sendFriendRequest(userID, authService.getCsrfToken());
        if (res.ok) {
          notifier.show(
            'Заявка отправлена',
            `Вы отправили заявку пользователю ${name}`,
            'success'
          );
          e.target.disabled = true;
          e.target.textContent = 'Заявка отправлена';
        } else {
          notifier.show('Ошибка', 'Не удалось отправить заявку', 'error');
        }
      },
    });
    addBtn.render();
  }

  return card;
}
