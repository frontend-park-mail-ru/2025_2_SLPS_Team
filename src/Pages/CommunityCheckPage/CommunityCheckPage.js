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

// моковые api
import {
  getCommunity,
  getCommunityPosts,
  getCommunitySubscribers,
  toggleCommunitySubscription,
  deleteCommunity,
} from '../../shared/api/communityApi.js';

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
  }

  async render() {
    this.resolveCommunityId();

    this.community = await getCommunity(this.communityId);

    const subscribersData = formatSubscribers(
      this.community.subscribersCount || 0,
    );
    const baseUrl = `${process.env.API_BASE_URL}/uploads/`;

//    const avatarPath =
//      !this.community.avatarPath || this.community.avatarPath === 'null'
//        ? '/public/globalImages/DefaultCommunity.svg'
//        : `${baseUrl}${this.community.avatarPath}`;
    
    const avatarPath = '/public/testData/CommunityAvatar.png';

    const coverPath =
      !this.community.coverPath || this.community.coverPath === 'null'
        ? '/public/globalImages/backgroud.png'
        : `${baseUrl}${this.community.coverPath}`;

    this.isOwner = this.community.ownerId === Number(authService.getUserId());
    this.isSubscribed = !!this.community.isSubscribed;

    const createdAtFormatted = formatDate(this.community.createdAt);
    const templateData = {
      community: {
        ...this.community,
        avatarPath,
        coverPath,
        name: this.community.name,
        description: this.community.description,
        createdAtFormatted,
        subscribersText: subscribersData.full,
        subscribersShort: subscribersData.short,
        isOwner: this.isOwner,
        isSubscribed: this.isSubscribed,
      },
    };

    this.wrapper = document.createElement('div');
    this.wrapper.innerHTML = CommunityCheckPageTemplate(templateData);

    this.root = this.wrapper.querySelector('.community-page');
    this.rootElement.appendChild(this.wrapper);

    this.initAboutBlock();
    this.initHeaderActions();
    await this.renderFeedBlock();
    await this.renderSubscribersBlock();

    const rerenderCommunityFeed = async () => {
      if (!this.wrapper) return;
      await this.renderFeedBlock();
    };

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
    }
  }

  async renderFeedBlock() {
    const feedContainer = this.root.querySelector(
      '[data-role="community-feed"]',
    );
    if (!feedContainer) return;

    const posts = await getCommunityPosts(this.communityId, 20);

    feedContainer.innerHTML = '';

    const feedElement = await renderFeed(posts, this.isOwner, {
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

        const row = renderCommunitySubscriberRow({
        id: user.id,
        fullName: user.fullName,
        avatarPath,
        onClick: (id) => {
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
        btn.textContent = 'Вы подписаны';
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
          authService.getCsrfToken(),
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

  initOwnerMenu() {
    const toggleBtn = this.root.querySelector('[data-role="owner-menu-toggle"]');
    const menu = this.root.querySelector('[data-role="owner-menu"]');
    if (!toggleBtn || !menu) return;

    const closeMenu = (e) => {
      if (!this.wrapper.contains(e.target)) {
        menu.classList.remove('community-owner-menu--open');
        document.removeEventListener('click', closeMenu);
      }
    };

    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.toggle('community-owner-menu--open');
      if (menu.classList.contains('community-owner-menu--open')) {
        document.addEventListener('click', closeMenu);
      } else {
        document.removeEventListener('click', closeMenu);
      }
    });

    const uploadCoverBtn = menu.querySelector('[data-action="upload-cover"]');
    const deleteBtn = menu.querySelector('[data-action="delete-community"]');

    if (uploadCoverBtn) {
      uploadCoverBtn.addEventListener('click', () => {
        notifier.show(
          'Загрузка обложки',
          'Функционал будет добавлен позже',
          'info',
        );
      });
    }

    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        const confirmModal = new ModalConfirm(
          'Удалить сообщество?',
          `Вы уверены, что хотите удалить сообщество «${this.community.name}»?`,
          async () => {
            try {
              await deleteCommunity(
                this.communityId,
                authService.getCsrfToken(),
              );
              notifier.show(
                'Сообщество удалено',
                'Сообщество было успешно удалено',
                'success',
              );
              navigateTo('/community');
            } catch (err) {
              console.error(err);
              notifier.show(
                'Ошибка',
                'Не удалось удалить сообщество',
                'error',
              );
            }
          },
        );
        confirmModal.open();
      });
    }
  }
}
