import FriendCardTemplate from './FriendCard.hbs';
import DropDown from '../../atoms/dropDown/dropDown';
import BaseButton from '../../atoms/BaseButton/BaseButton';
import { ModalConfirm } from '../ModalConfirm/ModalConfirm';
import { NotificationManager } from '../../organisms/NotificationsBlock/NotificationsManager';
import { navigateTo } from '../../../app/router/navigateTo';
import { deleteFriend, acceptFriend, sendFriendRequest, rejectFriendRequest } from '../../../shared/api/friendsApi';

import './FriendCard.css';

const notifier = new NotificationManager();

import type { FriendsListType } from '../../../shared/types/friends';

interface FriendCardContext {
  userID?: number;
  name?: string;
  age?: number;
  avatarPath?: string;
  listType?: FriendsListType;
}
export function renderFriendCard(context: FriendCardContext = {}): HTMLElement | null {
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
  const isSentList = listType === 'sent';


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

  const card = wrapper.firstElementChild as HTMLElement | null;

  const mainContent = card?.querySelector('.friend-card__main-content') as HTMLElement;
  mainContent?.addEventListener('click', () => {
    navigateTo(`/profile/${context.userID}`);
  });

  if (isFriendsList) {
    const dropButton = wrapper.querySelector('.fiend-actions-button') as HTMLElement;
    const friendActionsConatiner = wrapper.querySelector('.friend-actions-container') as HTMLElement;

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
                const res = await deleteFriend(userID!);
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
      ],
    });

    friendActions.render();

    dropButton.addEventListener('mouseenter', () => friendActions.show());
    friendActions.wrapper!.addEventListener('mouseenter', () => friendActions.show());

    dropButton.addEventListener('mouseleave', () => {
      setTimeout(() => {
        if (!friendActions.wrapper!.matches(':hover')) friendActions.hide();
      }, 50);
    });
    friendActions.wrapper!.addEventListener('mouseleave', () => friendActions.hide());
  }
  else if (isSubscribersList) {
    const buttonContainer = wrapper.querySelector('.freind-buttons-container') as HTMLElement;

    const acceptBtn = new BaseButton(buttonContainer, {
      text: 'Принять заявку',
      style: 'normal',
      onClick: async (e: MouseEvent) => {
        e.stopPropagation();

        const btn = e.target as HTMLButtonElement;
        btn.disabled = true;

        const res = await acceptFriend(userID!);
        if (res.ok) {
          notifier.show('Друг добавлен', `Вы добавили пользователя ${name} в друзья`, 'success');
          const textElement = document.createElement('span');
          textElement.classList.add('friend-status-text');
          textElement.textContent = 'В друзьях';
          btn.replaceWith(textElement);
        } else {
          btn.disabled = false;
          notifier.show('Ошибка', 'Не удалось принять заявку', 'error');
        }
      },
    });
    acceptBtn.render();
  }
  else if (isSentList) {
    const buttonContainer = wrapper.querySelector('.freind-buttons-container') as HTMLElement;

    const cancelBtn = new BaseButton(buttonContainer, {
      text: 'Отменить запрос',
      style: 'normal',
      onClick: async (e: MouseEvent) => {
        e.stopPropagation();

        const btn = e.target as HTMLButtonElement;
        btn.disabled = true;

        const res = await deleteFriend(userID!);

        if (res.ok) {
          notifier.show(
            'Запрос отменён',
            `Вы отменили запрос пользователю ${name}`,
            'success',
          );

          btn.textContent = 'Отменено';
        } else {
          btn.disabled = false;
          notifier.show('Ошибка', 'Не удалось отменить запрос', 'error');
        }
      },
    });

    cancelBtn.render();
  }else if (isPossibleList) {
    const buttonContainer = wrapper.querySelector('.freind-buttons-container') as HTMLElement;

    const addBtn = new BaseButton(buttonContainer, {
      text: 'Добавить в друзья',
      style: 'normal',
      onClick: async (e: MouseEvent) => {
        e.stopPropagation();
        if (!userID) return;

        const btn = e.currentTarget as HTMLButtonElement;
        btn.disabled = true;

        const res = await sendFriendRequest(userID);

        if (res.ok) {
          notifier.show(
            'Заявка отправлена',
            `Вы отправили заявку пользователю ${name}`,
            'success',
          );

          btn.textContent = 'Заявка отправлена';

        } else {
          btn.disabled = false;
          notifier.show('Ошибка', 'Не удалось отправить заявку', 'error');
        }
      },
    });
    addBtn.render();
  }

  return card;
}
