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

    const rerenderCommunityFeed = async () => {
      if (!this.wrapper) return;
      await this.renderFeedBlock();
    };

    // Ровно как в ProfilePage: слушаем изменения постов и перерисовываем ленту
    EventBus.on('community:newPost', rerenderCommunityFeed);
    EventBus.on('posts:created', rerenderCommunityFeed);
    EventBus.on('posts:updated', rerenderCommunityFeed);
    EventBus.on('posts:deleted', rerenderCommunityFeed);
  }

  initAboutBlock() {
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
    console.log(updatedCommunity);

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

      if (!actions.contains(e.target)) dropdown.hide();
    });
  }
}
