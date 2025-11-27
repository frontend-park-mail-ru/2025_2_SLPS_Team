import BasePage from '../BasePage.js';
import CommunityCheckPageTemplate from './CommunityCheckPage.hbs';
import './CommunityCheckPage.css';
import { renderCommunitySubscriberRow } from '../../components/molecules/CommunitySubscriberRow/CommunitySubscriberRow.js';

import { renderFeed } from '../../components/organisms/Feed/Feed.js';
import { NotificationManager } from '../../components/organisms/NotificationsBlock/NotificationsManager.js';
import { ModalConfirm } from '../../components/molecules/ModalConfirm/ModalConfirm.js';
import { EventBus } from '../../services/EventBus.js';
import { authService } from '../../services/AuthService.js';
import { navigateTo } from '../../app/router/navigateTo.js';
import DropDown from '../../components/atoms/dropDown/dropDown.js';
import BaseButton from '../../components/atoms/BaseButton/BaseButton.js';
import { EditCommunityModal } from '../../components/organisms/EditCommunityModal/EditCommunityModal.js';

import {
  getCommunity,
  getCommunitySubscribers,
  toggleCommunitySubscription,
  deleteCommunity,
} from '../../shared/api/communityApi.js';

import { getCommunityPosts } from '../../shared/api/postsApi.js';

import { renderHeaderCard } from '../../components/molecules/HeaderCard/HeaderCard.js';

const notifier = new NotificationManager();

/**
 * Форматирует дату для отображения "Дата создания"
 * @param {string|Date} dateStr
 */
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

export class CommunityCheckPage extends BasePage {
  constructor(rootElement, params) {
    super(rootElement);

    this.params = params;
    this.communityId = null;

    this.community = null;
    this.isOwner = false;
    this.isSubscribed = false;

    this.wrapper = null;
    this.root = null;

    this.posts = [];
  }

  async render() {
    this.resolveCommunityId();

    this.community = await getCommunity(this.communityId);

    const subscribersData = formatSubscribers(
      this.community.subscribersCount || 0,
    );
    const baseUrl = `${process.env.API_BASE_URL}/uploads/`;

    const avatarPath =
      !this.community.avatarPath || this.community.avatarPath === 'null'
        ? '/public/globalImages/DefaultAvatar.svg'
        : `${baseUrl}${this.community.avatarPath}`;

    const coverPath =
      !this.community.coverPath || this.community.coverPath === 'null'
        ? '/public/globalImages/DefaultHeader.svg'
        : `${baseUrl}${this.community.coverPath}`;

    this.isOwner =
      this.community.ownerID === authService.getUserId() ||
      this.community.ownerId === authService.getUserId();

    this.isSubscribed = !!this.community.isSubscribed;

    const createdAtFormatted = formatDate(this.community.createdAt);

    const templateData = {
      community: {
        ...this.community,
        name: this.community.name,
        description: this.community.description,
        createdAtFormatted,
        subscribersText: subscribersData.full,
        subscribersShort: subscribersData.short,
        isOwner: this.isOwner,
        isSubscribed: this.isSubscribed,

        avatarPath,
        coverPath,
      },
    };

    this.wrapper = document.createElement('div');
    this.wrapper.innerHTML = CommunityCheckPageTemplate(templateData);

    this.root = this.wrapper.querySelector('.community-page');
    if (this.root) {
      this.root.classList.add('community-check-page');
    }

    const headerRoot = this.wrapper.querySelector('#profile-card');

    renderHeaderCard(headerRoot, {
      coverPath: templateData.community.coverPath,
      avatarPath: templateData.community.avatarPath,
      title: templateData.community.name,
      subtitle: templateData.community.subscribersText,
      showMoreButton: false,

      isCommunity: true,
      isOwner: this.isOwner,
    });

    this.rootElement.appendChild(this.wrapper);

    this.initAboutBlock();
    this.initHeaderActions();
    await this.renderFeedBlock();
    await this.renderSubscribersBlock();

    const rerenderCommunityFeed = async () => {
      if (!this.wrapper) return;
      await this.renderFeedBlock();
    };

    // Просто перерисовываем ленту при любых CRUD-событиях по постам
    EventBus.on('posts:created', rerenderCommunityFeed);
    EventBus.on('posts:updated', rerenderCommunityFeed);
    EventBus.on('posts:deleted', rerenderCommunityFeed);
    
  }

  initAboutBlock() {
    const textEl = this.root.querySelector('[data-role="about-text"]');
    const moreBtn = this.root.querySelector('[data-role="about-more"]');
    const wrapperEl = this.root.querySelector(
      '[data-role="about-text-wrapper"]',
    );

    if (!textEl || !moreBtn || !wrapperEl) {
      return;
    }

    const maxHeight = 150;
    wrapperEl.style.maxHeight = `${maxHeight}px`;

    const isOverflowing = textEl.scrollHeight > maxHeight + 1;
    moreBtn.style.display = isOverflowing ? 'inline' : 'none';

    let expanded = false;

    moreBtn.addEventListener('click', () => {
      expanded = !expanded;

      if (expanded) {
        wrapperEl.style.maxHeight = 'none';
        moreBtn.textContent = 'Свернуть';
      } else {
        wrapperEl.style.maxHeight = `${maxHeight}px`;
        moreBtn.textContent = 'Показать ещё';
      }
    });
  }

  resolveCommunityId() {
    if (this.params && this.params.id) {
      this.communityId = Number(this.params.id);
    } else {
      // можно добавить обработку 404 / редирект
    }
  }

  async renderFeedBlock() {
    const feedContainer = this.root.querySelector(
      '[data-role="community-feed"]',
    );
    if (!feedContainer) return;

    // Получаем посты сообщества
    let posts = await getCommunityPosts(this.communityId, 1, 20);

    // Делаем структуру такой же, как в профиле (post + author + счётчики)
    const baseUrl = `${process.env.API_BASE_URL}/uploads/`;
    const communityAvatar =
      !this.community.avatarPath || this.community.avatarPath === 'null'
        ? '/public/globalImages/DefaultAvatar.svg'
        : `${baseUrl}${this.community.avatarPath}`;

    this.posts = (Array.isArray(posts) ? posts : []).map((post) => ({
      post,
      author: {
        id: this.community.id ?? this.communityId,
        fullName: this.community.name,
        avatarPath: communityAvatar,
        isCommunity: true,
      },
      likes: post.likeCount ?? post.like_count ?? 0,
      comments: post.commentCount ?? post.comment_count ?? 0,
      reposts: post.repostCount ?? post.repost_count ?? 0,
      isLiked: post.isLiked ?? false,
    }));

    feedContainer.innerHTML = '';

    const feedElement = await renderFeed(this.posts, this.isOwner, {
      mode: 'community',
      communityId: this.communityId,
    });

    feedContainer.appendChild(feedElement);
  }

  async renderSubscribersBlock() {
    const list = this.root.querySelector('[data-role="subscribers-list"]');
    if (!list) return;

    const subscribers = await getCommunitySubscribers(this.communityId, 5);
    list.innerHTML = '';

    if (!subscribers || !subscribers.length) {
      const empty = document.createElement('div');
      empty.className = 'community-subscribers-card__empty';
      empty.textContent = 'Пока нет подписчиков';
      list.appendChild(empty);
      return;
    }

    subscribers.forEach((user) => {
      const baseUrl = `${process.env.API_BASE_URL}/uploads/`;

      const avatarPath =
        !user.avatarPath || user.avatarPath === 'null'
          ? '/public/globalImages/DefaultAvatar.svg'
          : `${baseUrl}${user.avatarPath}`;

      const el = renderCommunitySubscriberRow({
        id: user.userID || user.id,
        avatarPath,
        fullName: user.fullName,
      });

      list.appendChild(el);
    });
  }

  initHeaderActions() {
    const joinBtn = this.root.querySelector(
      '[data-role="community-join-button"]',
    );
    const settingsBtn = this.root.querySelector(
      '[data-role="community-settings-button"]',
    );
    const deleteBtn = this.root.querySelector(
      '[data-role="community-delete-button"]',
    );

    if (joinBtn) {
      joinBtn.addEventListener('click', async () => {
        try {
          const result = await toggleCommunitySubscription(this.communityId);

          this.isSubscribed = !!result.isSubscribed;

          joinBtn.textContent = this.isSubscribed
            ? 'Вы подписаны'
            : 'Подписаться';

          notifier.show(
            this.isSubscribed ? 'Вы подписались' : 'Вы отписались',
            this.isSubscribed
              ? 'Вы подписались на сообщество'
              : 'Вы отписались от сообщества',
            'success',
          );
        } catch (e) {
          notifier.show(
            'Ошибка',
            'Не удалось изменить подписку на сообщество',
            'error',
          );
        }
      });
    }

    if (settingsBtn) {
      const dropdown = new DropDown(settingsBtn);

      const editItem = {
        text: 'Редактировать',
        style: 'normal',
        onClick: () => {
          dropdown.hide();

          const modal = new EditCommunityModal(
            document.body,
            this.communityId,
            this.community,
            (updatedCommunity) => {
              this.community = updatedCommunity;

              if (this.root) {
                const headerTitle = this.root.querySelector(
                  '[data-role="community-title"]',
                );
                const headerSubtitle = this.root.querySelector(
                  '[data-role="community-subtitle"]',
                );
                const avatarImg = this.root.querySelector(
                  '[data-role="community-avatar"]',
                );
                const coverImg = this.root.querySelector(
                  '[data-role="community-cover"]',
                );

                if (headerTitle) {
                  headerTitle.textContent = updatedCommunity.name;
                }

                if (headerSubtitle) {
                  const subData = formatSubscribers(
                    updatedCommunity.subscribersCount || 0,
                  );
                  headerSubtitle.textContent = subData.full;
                }

                const baseUrl = `${process.env.API_BASE_URL}/uploads/`;
                const avatarPath =
                  !updatedCommunity.avatarPath ||
                  updatedCommunity.avatarPath === 'null'
                    ? '/public/globalImages/DefaultAvatar.svg'
                    : `${baseUrl}${updatedCommunity.avatarPath}`;

                const coverPath =
                  !updatedCommunity.coverPath ||
                  updatedCommunity.coverPath === 'null'
                    ? '/public/globalImages/DefaultHeader.svg'
                    : `${baseUrl}${updatedCommunity.coverPath}`;

                if (avatarImg) {
                  avatarImg.src = avatarPath;
                }

                if (coverImg) {
                  coverImg.src = coverPath;
                }
              }
            },
          );

          modal.open();
        },
      };

      const deleteItem = {
        text: 'Удалить сообщество',
        style: 'danger',
        onClick: () => {
          dropdown.hide();

          const confirmModal = new ModalConfirm(document.body, {
            title: 'Удалить сообщество?',
            message:
              'Вы уверены, что хотите удалить сообщество? Это действие необратимо.',
            confirmText: 'Удалить',
            cancelText: 'Отмена',
            onConfirm: async () => {
              try {
                await deleteCommunity(this.communityId);

                notifier.show(
                  'Сообщество удалено',
                  'Сообщество успешно удалено',
                  'success',
                );

                navigateTo('/community');
              } catch (e) {
                notifier.show(
                  'Ошибка',
                  'Не удалось удалить сообщество',
                  'error',
                );
              }
            },
          });

          confirmModal.open();
        },
      };

      dropdown.setItems([editItem, deleteItem]);

      const btn = new BaseButton(settingsBtn, {
        text: 'Настроить',
        style: 'normal',
        onClick: () => dropdown.toggle(),
      });

      btn.render();

      document.addEventListener('click', (e) => {
        const actions = this.root.querySelector('.community-owner-actions');

        if (!actions.contains(e.target)) dropdown.hide();
      });
    }
  }
}

function formatSubscribers(count) {
  if (count == null) return { full: '0 подписчиков', short: '0' };

  if (count >= 1000000) {
    const m = (count / 1000000).toFixed(1).replace('.0', '');
    return {
      full: `${m} млн подписчиков`,
      short: `${m}М`,
    };
  }

  if (count >= 1000) {
    const k = (count / 1000).toFixed(1).replace('.0', '');
    return {
      full: `${k} тыс. подписчиков`,
      short: `${k}К`,
    };
  }

  return {
    full: `${count} подписчиков`,
    short: `${count}`,
  };
}
