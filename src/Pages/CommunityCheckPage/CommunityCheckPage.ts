import BasePage from '../BasePage';
import CommunityCheckPageTemplate from './CommunityCheckPage.hbs';
import './CommunityCheckPage.css';

import * as SubscriberRowModule from '../../components/molecules/CommunitySubscriberRow/CommunitySubscriberRow';
import { renderFeed } from '../../components/organisms/Feed/Feed';
import { NotificationManager } from '../../components/organisms/NotificationsBlock/NotificationsManager';
import { ModalConfirm } from '../../components/molecules/ModalConfirm/ModalConfirm';
import { EventBus } from '../../services/EventBus';
import { authService } from '../../services/AuthService';
import { navigateTo } from '../../app/router/navigateTo';
import DropDown from '../../components/atoms/dropDown/dropDown';
import BaseButton from '../../components/atoms/BaseButton/BaseButton';
import { EditCommunityModal } from '../../components/organisms/EditCommunityModal/EditCommunityModal';
import { isDarkTheme } from '../../helpers/InitTheme';

import {
  getCommunity,
  getCommunitySubscribers,
  toggleCommunitySubscription,
  deleteCommunity,
} from '../../shared/api/communityApi';

import { getCommunityPosts } from '../../shared/api/postsApi';
import { renderHeaderCard } from '../../components/molecules/HeaderCard/HeaderCard';

type PageParams = { id?: string };

type SubscribersFormat = { full: string; short: string };

type CommunityEntity = {
  id?: number;
  communityId?: number;
  name: string;
  description?: string | null;
  creatorID?: number | string | null;
  ownerId?: number | string | null;
  subscribersCount?: number | null;
  isSubscribed?: boolean | null;
  avatarPath?: string | null;
  coverPath?: string | null;
  createdAt?: string | null;
};

type SubscriberEntity = {
  userID: number;
  fullName: string;
  avatarPath: string | null;
};

type ToggleSubscriptionResponse = { isSubscribed?: boolean };

type TemplateCommunity = CommunityEntity & {
  description: string;
  createdAtFormatted: string;
  subscribersText: string;
  subscribersShort: string;
  isOwner: boolean;
  isSubscribed: boolean;
  avatarPath: string;
  coverPath: string;
};

type TemplateData = { community: TemplateCommunity };

type SubscriberRowArgs = {
  id: number;
  fullName: string;
  avatarPath: string;
  onClick: (id: number) => void;
};

type RenderSubscriberRowFn = (args: SubscriberRowArgs) => Node | null;

type SubscriberRowModuleShape = {
  renderCommunitySubscriberRow?: unknown;
  default?: unknown;
};

const notifier = new NotificationManager();

function formatSubscribers(count: number | null | undefined): SubscribersFormat {
  const safe = count ?? 0;

  if (safe >= 1000) {
    const short = (safe / 1000).toFixed(1).replace('.0', '');
    return { full: `${short}k подписчиков`, short: `${short}k` };
  }

  return { full: `${safe} подписчиков`, short: `${safe}` };
}

function formatDate(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';

  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

function uploadsBaseUrl(): string {
  return `${process.env.API_BASE_URL}/uploads/`;
}

function resolveImagePath(path: string | null | undefined, fallback: string): string {
  if (!path || path === 'null') return fallback;
  return `${uploadsBaseUrl()}${path}`;
}

function isNode(v: unknown): v is Node {
  return v instanceof Node;
}

function resolveSubscriberRowRenderer(): RenderSubscriberRowFn {
  const mod = SubscriberRowModule as unknown as SubscriberRowModuleShape;
  const candidate = mod.renderCommunitySubscriberRow ?? mod.default;
  if (typeof candidate !== 'function') {
    throw new Error('[CommunityCheckPage] renderCommunitySubscriberRow is not a function');
  }
  return candidate as RenderSubscriberRowFn;
}

const renderCommunitySubscriberRow = resolveSubscriberRowRenderer();

export class CommunityCheckPage extends BasePage {
  private params: PageParams;

  private communityId: number | null = null;
  private community: CommunityEntity | null = null;

  private isOwner = false;
  private isSubscribed = false;

  private wrapper: HTMLDivElement | null = null;
  private root: HTMLElement | null = null;

  private headerRoot: HTMLElement | null = null;
  private feedContainer: HTMLElement | null = null;
  private subscribersList: HTMLElement | null = null;
  private subscribeBtn: HTMLElement | null = null;

  private onCommunityPostChange: (() => void) | null = null;
  private boundDocClick: ((e: MouseEvent) => void) | null = null;

  constructor(rootElement: HTMLElement, params: PageParams = {}) {
    super(rootElement);
    this.params = params;
  }
  async render(): Promise<void> {
    this.resolveCommunityId();

    if (!this.communityId) {
      notifier.show('Ошибка', 'Не указан id сообщества', 'error');
      return;
    }

    this.community = (await getCommunity(this.communityId)) as CommunityEntity;
    this.computeFlags();

    const templateData = this.buildTemplateData();

    this.mountTemplate(templateData);
    this.cacheDom();
    this.renderHeader(templateData);

    this.initAboutBlock();
    this.initHeaderActions();

    await Promise.all([this.renderFeedBlock(), this.renderSubscribersBlock()]);
    this.bindFeedRerenderEvents();
  }

  destroy(): void {
    if (this.onCommunityPostChange) {
      EventBus.off('community:newPost', this.onCommunityPostChange);
      EventBus.off('posts:created', this.onCommunityPostChange);
      EventBus.off('posts:updated', this.onCommunityPostChange);
      EventBus.off('posts:deleted', this.onCommunityPostChange);
      this.onCommunityPostChange = null;
    }

    if (this.boundDocClick) {
      document.removeEventListener('click', this.boundDocClick);
      this.boundDocClick = null;
    }

    this.wrapper?.remove();
    this.wrapper = null;
    this.root = null;

    this.headerRoot = null;
    this.feedContainer = null;
    this.subscribersList = null;
    this.subscribeBtn = null;

    this.community = null;
    this.communityId = null;
  }

  private resolveCommunityId(): void {
    const raw = this.params?.id;
    const id = typeof raw === 'string' || typeof raw === 'number' ? Number(raw) : NaN;
    this.communityId = Number.isFinite(id) ? id : null;
  }

  private computeFlags(): void {
    if (!this.community) return;

    const currentUserId = Number(authService.getUserId());
    const creatorId = Number(this.community.creatorID);
    const ownerId = Number(this.community.ownerId);

    this.isOwner = creatorId === currentUserId || ownerId === currentUserId;
    this.isSubscribed = Boolean(this.community.isSubscribed);
  }

  private buildTemplateData(): TemplateData {
    if (!this.community) {
      throw new Error('[CommunityCheckPage] community is null');
    }

    const subscribersData = formatSubscribers(this.community.subscribersCount);

    const avatarPath = resolveImagePath(
      this.community.avatarPath,
      '/public/globalImages/DefaultAvatar.svg',
    );

    const coverPath = resolveImagePath(
      this.community.coverPath,
      '/public/globalImages/backgroud.png',
    );

    return {
      community: {
        ...this.community,
        description: this.community.description ?? '',
        createdAtFormatted: formatDate(this.community.createdAt),
        subscribersText: subscribersData.full,
        subscribersShort: subscribersData.short,
        isOwner: this.isOwner,
        isSubscribed: this.isSubscribed,
        avatarPath,
        coverPath,
      },
    };
  }

  private mountTemplate(templateData: TemplateData): void {
    this.wrapper = document.createElement('div');
    this.wrapper.innerHTML = CommunityCheckPageTemplate(templateData);

    this.root = this.wrapper.querySelector('.community-page');
    if (this.root) this.root.classList.add('community-check-page');

    this.rootElement.appendChild(this.wrapper);
  }

  private cacheDom(): void {
    if (!this.wrapper) return;

    this.headerRoot = this.wrapper.querySelector('#profile-card') as HTMLElement | null;

    this.root = this.wrapper.querySelector('.community-page') as HTMLElement | null;
    if (!this.root) return;

    this.feedContainer = this.root.querySelector('[data-role="community-feed"]') as HTMLElement | null;
    this.subscribersList = this.root.querySelector('[data-role="subscribers-list"]') as HTMLElement | null;
  }

  private renderHeader(templateData: TemplateData): void {
    if (!this.headerRoot) return;

    this.headerRoot.innerHTML = '';
    renderHeaderCard(this.headerRoot, {
      coverPath: templateData.community.coverPath,
      avatarPath: templateData.community.avatarPath,
      title: templateData.community.name,
      subtitle: templateData.community.subscribersText,
      showMoreButton: false,
      isCommunity: true,
      isOwner: this.isOwner,

      isSubscribed: this.isSubscribed,
      communityId: this.communityId!,
    });
      this.subscribeBtn = this.headerRoot.querySelector(
        '[data-role="subscribe-toggle"]'
      ) as HTMLElement | null;
  }

  private initAboutBlock(): void {
    if (!this.root) return;

    const textEl = this.root.querySelector('[data-role="about-text"]') as HTMLElement | null;
    const wrapperEl = this.root.querySelector('[data-role="about-wrapper"]') as HTMLElement | null;
    const moreBtn = this.root.querySelector('[data-role="about-more"]') as HTMLElement | null;

    if (!textEl || !wrapperEl || !moreBtn) return;

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

  private initHeaderActions(): void {
    if (!this.root) return;

    const ownerButton = this.root.querySelector('.owner-menu-button') as HTMLElement | null;
    const ownerDropdown = this.root.querySelector('.owner-menu-dropdown') as HTMLElement | null;

    if (this.isOwner) {
      if (this.subscribeBtn) this.subscribeBtn.style.display = 'none';
      if (ownerButton) ownerButton.style.display = '';
      if (ownerDropdown) ownerDropdown.style.display = '';
      this.initOwnerMenu();
      return;
    }

    if (ownerButton) ownerButton.style.display = 'none';
    if (ownerDropdown) ownerDropdown.style.display = 'none';
    if (this.subscribeBtn) this.subscribeBtn.style.display = '';
    this.initSubscribeButton();
  }

  private initSubscribeButton(): void {
    if (!this.subscribeBtn || !this.communityId) return;

    const btn = this.subscribeBtn;

    const updateView = (): void => {
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

    btn.onclick = null;

    btn.addEventListener('click', async () => {
    const id = this.communityId;
    if (id == null) return;

    try {
      const res = (await toggleCommunitySubscription(
        id,
        this.isSubscribed,
      )) as ToggleSubscriptionResponse;

      this.isSubscribed = Boolean(res?.isSubscribed);
      updateView();

      void this.renderSubscribersBlock();
    } catch (err) {
      console.error(err);
      notifier.show('Ошибка', 'Не удалось изменить подписку, попробуйте позже', 'error');
    }
  });
  }

  private async renderFeedBlock(): Promise<void> {
    if (!this.feedContainer || !this.communityId) return;

    const posts = await getCommunityPosts(this.communityId);
    this.feedContainer.innerHTML = '';

    const feedElement: unknown = await renderFeed(posts, this.isOwner, {
      mode: 'community',
      communityId: this.communityId,
    });

    if (isNode(feedElement)) {
      this.feedContainer.appendChild(feedElement);
    }
  }

  private async renderSubscribersBlock(): Promise<void> {
    if (!this.subscribersList || !this.communityId) return;

    const list = this.subscribersList;

    const raw = await getCommunitySubscribers(this.communityId, 5);
    const subscribers = (Array.isArray(raw) ? raw : []) as SubscriberEntity[];

    list.innerHTML = '';

    if (subscribers.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'community-subscribers-card__empty';
      empty.textContent = 'Пока нет подписчиков';
      list.appendChild(empty);
      return;
    }

    const fragment = document.createDocumentFragment();

    for (const user of subscribers) {
      const avatarPath = resolveImagePath(user.avatarPath, '/public/globalImages/DefaultAvatar.svg');

      const row = renderCommunitySubscriberRow({
        id: user.userID,
        fullName: user.fullName?.trim() || 'Без имени',
        avatarPath,
        onClick: (id: number) => navigateTo(`/profile/${id}`),
      });

      if (row) fragment.appendChild(row);
    }

    list.appendChild(fragment);
  }

  private bindFeedRerenderEvents(): void {
    if (this.onCommunityPostChange) return;

    this.onCommunityPostChange = () => {
      void this.renderFeedBlock();
    };

    EventBus.on('community:newPost', this.onCommunityPostChange);
    EventBus.on('posts:created', this.onCommunityPostChange);
    EventBus.on('posts:updated', this.onCommunityPostChange);
    EventBus.on('posts:deleted', this.onCommunityPostChange);
  }

  private applyUpdatedCommunity(updated: Partial<CommunityEntity> | null | undefined): void {
    if (!updated || !this.community) return;

    this.community = { ...this.community, ...updated };

    const subscribersData = formatSubscribers(this.community.subscribersCount);

    const avatarPath = resolveImagePath(
      this.community.avatarPath,
      '/public/globalImages/DefaultAvatar.svg',
    );

    let coverPath = "/public/globalImages/backgroud.png";
    if (isDarkTheme()) {
      coverPath = "/public/globalImages/DarkBackground.png"
    }

    if (this.headerRoot) {
      this.headerRoot.innerHTML = '';
      renderHeaderCard(this.headerRoot, {
        coverPath,
        avatarPath,
        title: this.community.name,
        subtitle: subscribersData.full,
        showMoreButton: false,
        isCommunity: true,
        isOwner: this.isOwner,

        isSubscribed: this.isSubscribed,
        communityId: this.communityId!,
      });
      this.subscribeBtn = this.headerRoot.querySelector(
        '[data-role="subscribe-toggle"]'
      ) as HTMLElement | null;
    }

    if (this.root) {
      const aboutText = this.root.querySelector('[data-role="about-text"]') as HTMLElement | null;
      if (aboutText) aboutText.textContent = this.community.description ?? '';
    }

    this.initHeaderActions();
  }

  private initOwnerMenu(): void {
    if (!this.root || !this.communityId || !this.community) return;

    const buttonContainer = this.root.querySelector('.owner-menu-button') as HTMLElement | null;
    const dropdownContainer = this.root.querySelector('.owner-menu-dropdown') as HTMLElement | null;
    if (!buttonContainer || !dropdownContainer) return;

    const dropdown = new DropDown(dropdownContainer, {
      values: [
        {
          label: 'Редактировать сообщество',
          icon: '/public/globalImages/EditIcon.svg',
          onClick: () => {
            const id = this.communityId;
            if (id == null) return;
            const communityModal = new EditCommunityModal({
              communityId: id,
              onSubmit: () => {},
              onCancel: () => {},
              FormData: {
                name: this.community!.name,
                description: this.community!.description ?? '',
                avatarPath: this.community!.avatarPath ?? null,
              },
              onSuccess: (updatedCommunity: Partial<CommunityEntity>) => {
                this.applyUpdatedCommunity(updatedCommunity);
              },
            });
            communityModal.open();
          },
        },
        {
          label: 'Удалить сообщество',
          icon: '/public/globalImages/DeleteImg.svg',
          onClick: () => {
            const modal = new ModalConfirm(
              'Удалить сообщество?',
              `Вы уверены, что хотите удалить «${this.community?.name ?? ''}»?`,
              async () => {
                await deleteCommunity(this.communityId!);
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

    if (this.boundDocClick) {
      document.removeEventListener('click', this.boundDocClick);
    }

    this.boundDocClick = (e: MouseEvent) => {
      if (!this.root) return;

      const actions = this.root.querySelector('.community-owner-actions') as HTMLElement | null;
      if (!actions) return;

      const target = e.target;
      if (target instanceof Node && !actions.contains(target)) dropdown.hide();
    };

    document.addEventListener('click', this.boundDocClick);
  }
}
