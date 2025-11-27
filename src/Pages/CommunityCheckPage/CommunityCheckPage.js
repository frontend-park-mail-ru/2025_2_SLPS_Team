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

function formatSubscribers(count) {
  if (count == null) return '';
  if (count >= 1000) {
    const short = (count / 1000).toFixed(1).replace('.0', '');
    return {
      full: `${short}k подписчиков`,
      short: `${short}k`,
    };
  }
  return {
    full: `${count} подписчиков`,
    short: `${count}`,
  };
}

function formatDate(iso) {
  if (!iso) return '';

  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return '';
  }

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

    this._onPostCreated = null;
    this._onPostUpdated = null;
    this._onPostDeleted = null;
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
        ? '/public/globalImages/backgroud.png'
        : `${baseUrl}${this.community.coverPath}`;

    const currentUserId = Number(authService.getUserId());

    this.isOwner =
      Number(this.community.creatorID) === currentUserId ||
      Number(this.community.ownerId) === currentUserId;

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

    this.subscribeToPostEvents();
  }

  destroy() {
    this.unsubscribeFromPostEvents();

    if (this.rootElement && this.wrapper && this.rootElement.contains(this.wrapper)) {
      this.rootElement.removeChild(this.wrapper);
    }

    this.wrapper = null;
    this.root = null;
  }

  resolveCommunityId() {
    if (this.params && this.params.id) {
      this.communityId = Number(this.params.id);
    } else {
      // можно добавить обработку, если пришли без id
    }
  }

  initAboutBlock() {
    if (!this.root) return;

    const textEl = this.root.querySelector('[data-role="about-text"]');
    const wrapperEl = this.root.querySelector('[data-role="about-wrapper"]');
    const moreBtn = this.root.querySelector('[data-role="about-more"]');

    if (!textEl || !wrapperEl || !moreBtn) {
      return;
    }

    const computed = getComputedStyle(textEl);
    const lineHeight = parseFloat(computed.lineHeight) || 18;
    const maxHeight = lineHeight * 3;

    wrapperEl.style.maxHeight = `${maxHeight}px`;
    wrapperEl.style.overflow = 'hidden';

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

  async renderFeedBlock() {
    if (!this.wrapper) return;

    const feedContainer = this.wrapper.querySelector(
      '[data-role="community-feed"]',
    );
    if (!feedContainer) {
      console.warn('[CommunityCheckPage] feed container not found');
      return;
    }

    try {
      const posts = await getCommunityPosts(this.communityId, 1, 20);

      // очищаем и рендерим ленту заново
      feedContainer.innerHTML = '';

      const feedElement = await renderFeed(posts, this.isOwner, {
        mode: 'community',
        communityId: this.communityId,
      });

      feedContainer.appendChild(feedElement);
    } catch (err) {
      console.error('[CommunityCheckPage] failed to load community posts', err);
      notifier.show(
        'Ошибка',
        'Не удалось загрузить посты сообщества',
        'error',
      );
    }
  }

  async renderSubscribersBlock() {
    if (!this.root) return;

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

      const subscriberId = user.userID ?? user.userId ?? user.id;
      const fullName =
        user.fullName ||
        [user.firstName, user.lastName].filter(Boolean).join(' ') ||
        'Без имени';

      const row = renderCommunitySubscriberRow({
        id: subscriberId,
        fullName,
        avatarPath,
        onClick: (id) => {
          if (!id) {
            console.warn('[CommunityCheckPage] empty subscriber id', user);
            return;
          }
          navigateTo(`/profile/${id}`);
        },
      });

      list.appendChild(row);
    });
  }

  initHeaderActions() {
    if (this.isOwner) {
      this.initOwnerMenu();
    } else {
      this.initSubscribeButton();
    }
  }

  initSubscribeButton() {
    if (!this.root) return;

    const btn = this.root.querySelector('[data-role="subscribe-toggle"]');
    if (!btn) return;

    const updateView = () => {
      if (this.isSubscribed) {
        btn.classList.add('community-subscribe-btn--active');
        btn.innerHTML = `
          <img class="community-subscribe-btn-icon" src="/public/globalImages/SmallCheckIcon.svg">
          Вы подписаны
        `;
      } else {
        btn.classList.remove('community-subscribe-btn--active');
        btn.textContent = 'Подписаться';
      }
    };

    updateView();

    btn.addEventListener('click', async () => {
      try {
        const res = await toggleCommunitySubscription(
          this.communityId,
          this.isSubscribed,
        );
        this.isSubscribed = !!res.isSubscribed;
        updateView();
      } catch (err) {
        console.error(err);
        notifier.show(
          'Ошибка',
          'Не удалось изменить подписку, попробуйте позже',
          'error',
        );
      }
    });
  }

  applyUpdatedCommunity(updatedCommunity) {
    if (!updatedCommunity) return;

    this.community = {
      ...this.community,
      ...updatedCommunity,
    };

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
        ? '/public/globalImages/backgroud.png'
        : `${baseUrl}${this.community.coverPath}`;

    const headerRoot = this.wrapper.querySelector('#profile-card');
    if (headerRoot) {
      headerRoot.innerHTML = '';
      renderHeaderCard(headerRoot, {
        coverPath,
        avatarPath,
        title: this.community.name,
        subtitle: subscribersData.full,
        showMoreButton: false,
        isCommunity: true,
        isOwner: this.isOwner,
      });
    }

    const aboutText = this.root.querySelector('[data-role="about-text"]');
    if (aboutText) {
      aboutText.textContent = this.community.description || '';
    }

    this.initHeaderActions();
  }

  initOwnerMenu() {
    if (!this.root) return;

    const buttonContainer = this.root.querySelector('.owner-menu-button');
    const dropdownContainer = this.root.querySelector('.owner-menu-dropdown');

    if (!buttonContainer || !dropdownContainer) return;

    const dropdown = new DropDown(dropdownContainer, {
      values: [
        {
          label: 'Редактировать сообщество',
          onClick: () => {
            const communityModal = new EditCommunityModal({
              communityId: this.communityId,
              onSubmit: () => {},
              onCancel: () => {},
              FormData: {
                ...this.community,
                name: this.community.name,
                description: this.community.description,
                avatarPath: this.community.avatarPath || null,
              },
              onSuccess: (updatedCommunity) => {
                this.applyUpdatedCommunity(updatedCommunity);
              },
            });
            communityModal.open();
          },
          icon: '/public/globalImages/EditIcon.svg',
        },
        {
          label: 'Удалить сообщество',
          icon: '/public/globalImages/DeleteImg.svg',
          onClick: () => {
            const modal = new ModalConfirm(
              'Удалить сообщество?',
              `Вы уверены, что хотите удалить «${this.community.name}»?`,
              async () => {
                await deleteCommunity(
                  this.communityId,
                  authService.getCsrfToken(),
                );
                navigateTo('/community');
              },
            );
            modal.open();
          },
        },
      ],
    });

    dropdown.render();
    dropdown.hide();

    const btn = new BaseButton(buttonContainer, {
      text: 'Настроить',
      style: 'normal',
      onClick: () => dropdown.toggle(),
    });

    btn.render();

    document.addEventListener('click', (e) => {
      const actions = this.root.querySelector('.community-owner-actions');
      if (!actions) return;

      if (!actions.contains(e.target)) dropdown.hide();
    });
  }


  _payloadBelongsToThisCommunity(payload) {
    if (!payload) return true; 

    const post = payload.post || payload;
    if (!post) return true;

    const communityId =
      post.communityID || post.communityId || post.community_id;

    if (!communityId) return true;

    return Number(communityId) === Number(this.communityId);
  }

  subscribeToPostEvents() {
    this.unsubscribeFromPostEvents();

    this._onPostCreated = async (payload) => {
      if (
        !this.wrapper ||
        !this.rootElement.contains(this.wrapper) ||
        !this._payloadBelongsToThisCommunity(payload)
      ) {
        return;
      }

      console.log(
        '[CommunityCheckPage] post created event',
        payload,
        'communityId:',
        this.communityId,
      );

      notifier.show('Успех', 'Пост опубликован', 'success');
      await this.renderFeedBlock();
    };

    this._onPostUpdated = async (payload) => {
      if (
        !this.wrapper ||
        !this.rootElement.contains(this.wrapper) ||
        !this._payloadBelongsToThisCommunity(payload)
      ) {
        return;
      }

      console.log('[CommunityCheckPage] post updated event', payload);

      await this.renderFeedBlock();
    };

    this._onPostDeleted = async (payload) => {
      if (
        !this.wrapper ||
        !this.rootElement.contains(this.wrapper) ||
        !this._payloadBelongsToThisCommunity(payload)
      ) {
        return;
      }

      console.log('[CommunityCheckPage] post deleted event', payload);

      notifier.show('Удалено', 'Пост был удалён', 'success');
      await this.renderFeedBlock();
    };

    EventBus.on('posts:created', this._onPostCreated);
    EventBus.on('posts:updated', this._onPostUpdated);
    EventBus.on('posts:deleted', this._onPostDeleted);

    EventBus.on('community:newPost', this._onPostCreated);
    EventBus.on('community:postCreated', this._onPostCreated);
    EventBus.on('community:postUpdated', this._onPostUpdated);
    EventBus.on('community:postDeleted', this._onPostDeleted);
  }

  unsubscribeFromPostEvents() {
    if (!this._onPostCreated && !this._onPostUpdated && !this._onPostDeleted) {
      return;
    }

    const createdHandlers = [
      this._onPostCreated,
    ];
    const updatedHandlers = [
      this._onPostUpdated,
    ];
    const deletedHandlers = [
      this._onPostDeleted,
    ];

    const createdEvents = ['posts:created', 'community:newPost', 'community:postCreated'];
    const updatedEvents = ['posts:updated', 'community:postUpdated'];
    const deletedEvents = ['posts:deleted', 'community:postDeleted'];

    createdEvents.forEach((ev) =>
      createdHandlers.forEach((h) => h && EventBus.off(ev, h)),
    );
    updatedEvents.forEach((ev) =>
      updatedHandlers.forEach((h) => h && EventBus.off(ev, h)),
    );
    deletedEvents.forEach((ev) =>
      deletedHandlers.forEach((h) => h && EventBus.off(ev, h)),
    );

    this._onPostCreated = null;
    this._onPostUpdated = null;
    this._onPostDeleted = null;
  }
}
