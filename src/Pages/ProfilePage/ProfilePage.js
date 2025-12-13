import BasePage from '../BasePage.js';
import { renderFeed } from '../../components/organisms/Feed/Feed.ts';
import ProfilePageTemplate from './ProfilePage.hbs';
import { EditProfileForm } from '../../components/organisms/EditProfileForm/EditProfileForm.ts';
import { renderCommunitiesList } from '../../components/molecules/CommunitiesList/CommunitiesList.ts';
import { authService } from '../../services/AuthService.ts';
import { NotificationManager } from '../../components/organisms/NotificationsBlock/NotificationsManager.ts';
import { ModalConfirm } from '../../components/molecules/ModalConfirm/ModalConfirm.ts';
import { EventBus } from '../../services/EventBus.js';
import { navigateTo } from '../../app/router/navigateTo.js';

import {
  getProfile,
  getUserPosts,
  getProfileFriendStatus,
  sendProfileFriendRequest,
  openChatWithUser,
} from '../../shared/api/profileApi.js';

import { renderHeaderCard } from '../../components/molecules/HeaderCard/HeaderCard.ts';

const notifier = new NotificationManager();

function formatDob(dobStr) {
  const dob = new Date(dobStr);
  const dobFormatted = new Intl.DateTimeFormat('ru-RU').format(dob);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return { dobFormatted, age };
}


export class ProfilePage extends BasePage {
  constructor(rootElement, params) {
    super(rootElement);
    this.posts = [];
    this.profileData = [];
    this.friendsData = [];
    this.params = params;
    this.userId = null;
    this.isOwner = false;
    this.friendsStatus = null;
    this.wrapper = null;
  }

  async render() {
    this.resolveUserId();

    this.profileData = await getProfile(this.userId);

    const { dobFormatted, age } = formatDob(this.profileData.dob);

    this.isOwner = this.userId === authService.getUserId();

    if (!this.isOwner) {
      this.friendsStatus = await getProfileFriendStatus(this.userId);
    }

    const rc = this.profileData.relationsCount || {};
    this.friendsData = {
      count_friends: rc.countAccepted ?? 0,
      count_followers: rc.countPending ?? 0,
      count_follows: rc.countSent ?? 0,
      count_blocked: rc.countBlocked ?? 0,
    };

    const baseUrl = `${process.env.API_BASE_URL}/uploads/`;
    const avatarPath =
      !this.profileData.avatarPath || this.profileData.avatarPath === 'null'
        ? '/public/globalImages/DefaultAvatar.svg'
        : `${baseUrl}${this.profileData.avatarPath}`;

    const templateData = {
      user: {
        ...this.profileData,
        fullName: `${this.profileData.firstName} ${this.profileData.lastName}`,
        dobFormatted,
        age,
        isOwner: this.isOwner,
        avatarPath,
      },
      showCancelRequest: this.friendsStatus === 'pending',
      showMessage: this.friendsStatus === 'accepted',
      showAddFriend: this.friendsStatus === '',
      showBlocked: this.friendsStatus === 'blocked',
      friends: this.friendsData,
    };

    this.wrapper = document.createElement('div');
    this.wrapper.innerHTML = ProfilePageTemplate(templateData);

    const headerRoot = this.wrapper.querySelector('#profile-card');

    renderHeaderCard(headerRoot, {
      coverPath: '/public/globalImages/backgroud.png',
      avatarPath: templateData.user.avatarPath,
      title: templateData.user.fullName,
      subtitle: `${templateData.user.age} лет`,
      showMoreButton: true,

      isProfile: true,
      isOwner: templateData.user.isOwner,
      showCancelRequest: templateData.showCancelRequest,
      showMessage: templateData.showMessage,
      showAddFriend: templateData.showAddFriend,
      showBlocked: templateData.showBlocked,
    });

    const mainContainer = this.wrapper.querySelector('.profile-page');

    const moreBtn = this.wrapper.querySelector('.profile-toggle-btn');
    if (moreBtn) {
      moreBtn.addEventListener('click', () => {
        this.wrapper
          .querySelector('.profile-info')
          .classList.toggle('expanded');
      });
    }

    await this.renderPostsBlock();

    const editButton = this.wrapper.querySelector('.edit-open');
    if (editButton) {
      const EditProfileModal = new EditProfileForm(
        this.rootElement,
        templateData.user,
      );
      editButton.addEventListener('click', () => EditProfileModal.open());
    }

    this.addListeners(templateData.user);

      const communitiesList = await renderCommunitiesList(this.userId);
      const followsContainer = this.wrapper.querySelector('.folows-container');
      if (followsContainer && communitiesList) {
        followsContainer.appendChild(communitiesList);
      }


    this.rootElement.appendChild(this.wrapper);

    const rerenderProfileFeed = async () => {
      if (!this.wrapper) return;
      await this.renderPostsBlock();
    };

    EventBus.on('profile:newPost', rerenderProfileFeed);
    EventBus.on('posts:created', rerenderProfileFeed);
    EventBus.on('posts:updated', rerenderProfileFeed);
    EventBus.on('posts:deleted', rerenderProfileFeed);
  }


  async renderPostsBlock() {
    this.posts = await getUserPosts(this.userId, 20);
    this.posts = this.posts.map((post) => ({
      post,
      author: {
        id: this.userId,
        fullName: `${this.profileData.firstName} ${this.profileData.lastName}`,
        avatarPath: this.profileData.avatarPath,
      },
      likes: post.likeCount ?? post.like_count ?? 0,
      comments: post.commentCount ?? post.comment_count ?? 0,
      reposts: post.repostCount ?? post.repost_count ?? 0,
      isLiked: post.isLiked ?? false,
    }));


    const feedContainer = this.wrapper.querySelector('.profile-feed-container');
    feedContainer.innerHTML = '';

    const feedElement = await renderFeed(this.posts, this.isOwner, {
      mode: 'profile',
    });

    feedContainer.appendChild(feedElement);
  }

  resolveUserId() {
    if (this.params && this.params.id) {
      this.userId = Number(this.params.id);
      if (this.userId === Number(authService.getUserId())) {
        this.isOwner = true;
      }
    } else {
      this.userId = Number(authService.getUserId());
      this.isOwner = true;
    }
  }

  addListeners(userData) {
    const addFriendBtn = this.wrapper.querySelector('.add-friend-btn');
    if (addFriendBtn) {
      addFriendBtn.addEventListener(
        'click',
        async () => {
          try {
            const res = await sendProfileFriendRequest(
              this.userId,
              authService.getCsrfToken(),
            );
            if (!res.ok) {
              notifier.show(
                'Ошибка',
                'Не удалось отправить заявку, попробуйте позже',
                'error',
              );
              return;
            }
            notifier.show(
              'Заявка отправлена',
              'Заявка в друзья отправлена успешно',
              'success',
            );
            addFriendBtn.textContent = 'Заявка отправлена';
            addFriendBtn.classList.remove('add-friend-btn');
            addFriendBtn.classList.add('request-text');
            addFriendBtn.disabled = true;
          } catch (err) {
            console.error(err);
          }
        },
        { once: true },
      );
    }

    const messageBtn = this.wrapper.querySelector('.message-btn');
    if (messageBtn) {
      messageBtn.addEventListener('click', async () => {
        try {
          await openChatWithUser(this.userId);
          navigateTo('/messanger');
          const userPayload = {
            id: this.userId,
            name: `${this.profileData.firstName} ${this.profileData.lastName}`,
            avatarPath: this.profileData.avatarPath,
          };
          setTimeout(() => EventBus.emit('openChat', { data: userPayload }), 100);
        } catch (err) {
          console.error(err);
        }
      });
    }

    const unblockButton = this.wrapper.querySelector('.unblock-user-btn');
    if (unblockButton) {
      unblockButton.addEventListener('click', () => {
        const blockConfirm = new ModalConfirm(
          'Подтвердите действие',
          `Вы уверены, что хотите разблокировать пользователя ${userData.fullName}?`,
          async () => {
            try {
              // ручка для разблокировать
              notifier.show(
                'Пользователь разблокирован',
                `Вы разблокировали пользователя ${userData.fullName}`,
                'success',
              );
              const newBtn = document.createElement('button');
              newBtn.textContent = 'Добавить в друзья';
              newBtn.classList.add('add-friend-btn');
              unblockButton.replaceWith(newBtn);
              newBtn.addEventListener(
                'click',
                () => sendProfileFriendRequest(this.userId),
                {
                  once: true,
                },
              );
            } catch (err) {
              notifier.show(
                'Ошибка',
                'Не удалось разблокировать пользователя',
                'error',
              );
              console.error(err);
            }
          },
        );
        blockConfirm.open();
      });
    }
  }
}
