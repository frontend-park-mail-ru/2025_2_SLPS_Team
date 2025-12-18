import BasePage from '../BasePage';
import ProfilePageTemplate from './ProfilePage.hbs';

import { renderFeed } from '../../components/organisms/Feed/Feed';
import { EditProfileForm } from '../../components/organisms/EditProfileForm/EditProfileForm';
import { renderCommunitiesList } from '../../components/molecules/CommunitiesList/CommunitiesList';
import { renderHeaderCard } from '../../components/molecules/HeaderCard/HeaderCard';

import { authService } from '../../services/AuthService';
import { EventBus } from '../../services/EventBus';
import { navigateTo } from '../../app/router/navigateTo';

import { NotificationManager } from '../../components/organisms/NotificationsBlock/NotificationsManager';
import { ModalConfirm } from '../../components/molecules/ModalConfirm/ModalConfirm';
import { isDarkTheme } from '../../helpers/InitTheme';

import {
  getProfile,
  getUserPosts,
  getProfileFriendStatus,
  sendProfileFriendRequest,
  openChatWithUser,
} from '../../shared/api/profileApi';

import type { ProfileDTO, ProfilePageParams, ProfileTemplateData } from '../../shared/types/profile';
import type { FriendStatus, FriendsCount } from '../../shared/types/friends';

const notifier = new NotificationManager();

type PostApiResponse = Record<string, unknown>;

function formatDob(dobStr?: string | null): { dobFormatted: string; age: number } {
  if (!dobStr) return { dobFormatted: '', age: 0 };

  const dob = new Date(dobStr);
  const dobFormatted = new Intl.DateTimeFormat('ru-RU').format(dob);

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;

  return { dobFormatted, age };
}

export class ProfilePage extends BasePage {
  private posts: PostApiResponse[] = [];
  private profileData!: ProfileDTO;
  private friendsData!: FriendsCount;

  private params: ProfilePageParams | undefined;
  private userId!: number;
  private isOwner = false;
  private friendsStatus: FriendStatus = '';
  private wrapper: HTMLElement | null = null;

  constructor(rootElement: HTMLElement, params?: ProfilePageParams) {
    super(rootElement);
    this.params = params;
  }

  async render(): Promise<void> {
    this.resolveUserId();

    this.profileData = await getProfile(this.userId);

    const { dobFormatted, age } = formatDob(this.profileData.dob);
    this.isOwner = this.userId === authService.getUserId();

    if (!this.isOwner) {
      this.friendsStatus = await getProfileFriendStatus(this.userId);
    }

    const rc = this.profileData.relationsCount ?? {};
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

    const templateData: ProfileTemplateData = {
      user: {
        fullName: `${this.profileData.firstName} ${this.profileData.lastName}`,
        dobFormatted,
        age,
        avatarPath,
        isOwner: this.isOwner,
      },
      showCancelRequest: this.friendsStatus === 'pending',
      showMessage: this.friendsStatus === 'accepted',
      showAddFriend: this.friendsStatus === '',
      showBlocked: this.friendsStatus === 'blocked',
      friends: this.friendsData,
    };

    this.wrapper = document.createElement('div');
    this.wrapper.innerHTML = ProfilePageTemplate(templateData);

    this.renderHeader(templateData);

    const moreBtn = this.wrapper.querySelector<HTMLElement>('.profile-toggle-btn');
    if (moreBtn) {
      moreBtn.addEventListener('click', () => {
        this.wrapper?.querySelector('.profile-info')?.classList.toggle('expanded');
      });
    }

    await this.renderPostsBlock();

    const editButton = this.wrapper.querySelector<HTMLElement>('.edit-open');
    if (editButton) {
      const editModal = new EditProfileForm(this.rootElement, {
        fullName: `${this.profileData.firstName} ${this.profileData.lastName}`,
        avatarPath: this.profileData.avatarPath ?? null,
        aboutMyself: (this.profileData as unknown as { aboutMyself?: string | null }).aboutMyself ?? '',
        dob: this.profileData.dob ?? new Date().toISOString(),
        gender: (this.profileData as unknown as { gender?: string | null }).gender ?? 'Мужской',
      });

      editButton.addEventListener('click', () => editModal.open());
    }

    this.addListeners(templateData.user);

    const followsContainer = this.wrapper.querySelector<HTMLElement>('.folows-container');
    if (followsContainer) {
      const communities = await renderCommunitiesList(this.userId);
      if (communities) followsContainer.appendChild(communities);
    }

    this.rootElement.appendChild(this.wrapper);

    const rerenderProfileFeed = async () => {
      await this.renderPostsBlock();
    };

    EventBus.on('profile:newPost', rerenderProfileFeed);
    EventBus.on('posts:created', rerenderProfileFeed);
    EventBus.on('posts:updated', rerenderProfileFeed);
    EventBus.on('posts:deleted', rerenderProfileFeed);
  }

  private renderHeader(data: ProfileTemplateData): void {
    const headerRoot = this.wrapper?.querySelector<HTMLElement>('#profile-card');
    if (!headerRoot) return;

    let headerImage = "/public/globalImages/backgroud.png";
    if (isDarkTheme()) {
      headerImage = "/public/globalImages/CancelIcon.svg"
    }

    renderHeaderCard(headerRoot, {
      coverPath: headerImage,
      avatarPath: data.user.avatarPath,
      title: data.user.fullName,
      subtitle: `${data.user.age} лет`,
      showMoreButton: true,
      isProfile: true,
      isOwner: data.user.isOwner,
      showCancelRequest: data.showCancelRequest,
      showMessage: data.showMessage,
      showAddFriend: data.showAddFriend,
      showBlocked: data.showBlocked,
    });
  }

  private async renderPostsBlock(): Promise<void> {
    if (!this.wrapper) return;

    this.posts = (await getUserPosts(this.userId, 20)) as PostApiResponse[];

    const mapped = this.posts.map((post) => ({
      post,
      author: {
        id: this.userId,
        fullName: `${this.profileData.firstName} ${this.profileData.lastName}`,
        avatarPath: this.profileData.avatarPath ?? null,
      },
      likes: (post.likeCount as number | undefined) ?? (post.like_count as number | undefined) ?? 0,
      comments:
        (post.commentCount as number | undefined) ?? (post.comment_count as number | undefined) ?? 0,
      reposts:
        (post.repostCount as number | undefined) ?? (post.repost_count as number | undefined) ?? 0,
      isLiked: (post.isLiked as boolean | undefined) ?? false,
    }));

    const feedContainer = this.wrapper.querySelector<HTMLElement>('.profile-feed-container');
    if (!feedContainer) return;

    feedContainer.innerHTML = '';

    const feedElement = await renderFeed(mapped, this.isOwner, { mode: 'profile' });
    feedContainer.appendChild(feedElement);
  }

  private resolveUserId(): void {
    const authId = authService.getUserId();
    const paramId = this.params?.id;

    this.userId = paramId ? Number(paramId) : Number(authId);
    this.isOwner = this.userId === authId;
  }

  private addListeners(userData: ProfileTemplateData['user']): void {
    const addFriendBtn =
      this.wrapper?.querySelector<HTMLButtonElement>('.add-friend-btn');

    if (addFriendBtn) {
      addFriendBtn.addEventListener(
        'click',
        async () => {
          try {
            await sendProfileFriendRequest(this.userId);

            notifier.show(
              'Заявка отправлена',
              'Заявка в друзья отправлена успешно',
              'success',
            );

            addFriendBtn.textContent = 'Заявка отправлена';
            addFriendBtn.classList.remove('add-friend-btn');
            addFriendBtn.classList.add('request-text');
            addFriendBtn.disabled = true;
          } catch (err: unknown) {
            console.error(err);
            notifier.show(
              'Ошибка',
              'Не удалось отправить заявку, попробуйте позже',
              'error',
            );
          }
        },
        { once: true },
      );
    }

    const messageBtn =
      this.wrapper?.querySelector<HTMLButtonElement>('.message-btn');

    if (messageBtn) {
      messageBtn.addEventListener('click', async () => {
        try {
          await openChatWithUser(this.userId);
          navigateTo('/messanger');

          const userPayload = {
            id: this.userId,
            name: userData.fullName,
            avatarPath: userData.avatarPath,
          };

          setTimeout(() => EventBus.emit('openChat', { data: userPayload }), 100);
        } catch (err: unknown) {
          console.error(err);
          notifier.show('Ошибка', 'Не удалось открыть чат', 'error');
        }
      });
    }

    const unblockButton =
      this.wrapper?.querySelector<HTMLButtonElement>('.unblock-user-btn');

    if (unblockButton) {
      unblockButton.addEventListener('click', () => {
        const blockConfirm = new ModalConfirm(
          'Подтвердите действие',
          `Вы уверены, что хотите разблокировать пользователя ${userData.fullName}?`,
          async () => {
            try {
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
                async () => {
                  try {
                    await sendProfileFriendRequest(this.userId);

                    notifier.show(
                      'Заявка отправлена',
                      'Заявка в друзья отправлена успешно',
                      'success',
                    );

                    newBtn.textContent = 'Заявка отправлена';
                    newBtn.classList.remove('add-friend-btn');
                    newBtn.classList.add('request-text');
                    newBtn.disabled = true;
                  } catch (err: unknown) {
                    console.error(err);
                    notifier.show(
                      'Ошибка',
                      'Не удалось отправить заявку, попробуйте позже',
                      'error',
                    );
                  }
                },
                { once: true },
              );
            } catch (err: unknown) {
              console.error(err);
              notifier.show('Ошибка', 'Не удалось разблокировать пользователя', 'error');
            }
          },
        );

        blockConfirm.open();
      });
    }
  }

}
