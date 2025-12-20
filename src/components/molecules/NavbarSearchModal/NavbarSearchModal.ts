import Template from './NavbarSearchModal.hbs';
import './NavbarSearchModal.css';
import { navigateTo } from '../../../app/router/navigateTo';

import {
  getFriends,
  getPossibleFriends,
  searchProfiles,
  sendFriendRequest,
} from '../../../shared/api/friendsApi';

import {
  getMyCommunities,
  getOtherCommunities,
  searchCommunities,
} from '../../../shared/api/communityApi';
import templateAvatar from './navbarSearchItem.hbs';

type UserStatus = 'accepted' | 'pending' | 'sent' | 'notFriends';

type ProfileEntity = {
  userID: number | null;
  fullName: string;
  avatarPath: string | null;
  status: UserStatus | string | null;
  type?: string | null;
};

type CommunityEntity = {
  id: number | null;
  communityID: number | null;
  name: string;
  title?: string | null;
  avatarPath?: string | null;
  avatar?: string | null;
  avatarURL?: string | null;
  iconPath?: string | null;
  subscriptionType?: 'subscriber' | 'recommended' | string | null;
};

type RenderUsersOptions = { append?: boolean };
type RenderCommunitiesOptions = { append?: boolean };

function toNumberOrNull(v: unknown): number | null {
  const n = typeof v === 'string' || typeof v === 'number' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
}

function toStringOrEmpty(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function toStringOrNull(v: unknown): string | null {
  return typeof v === 'string' ? v : null;
}

export class NavbarSearchModal {
  private containerEl: HTMLElement;
  private baseUrl: string;

  private rootEl: HTMLElement | null = null;

  private usersListEl: HTMLElement | null = null;
  private communitiesListEl: HTMLElement | null = null;

  private showAllBtn: HTMLElement | null = null;

  private inputEl: HTMLInputElement | null = null;

  private debounceTimer: number | null = null;
  private loadedInitial = false;

  private currentQuery = '';
  private currentPage = 1;

  private handleDocumentClickBound: (e: MouseEvent) => void;

  constructor(containerEl: HTMLElement, baseUploadsUrl: string) {
    this.containerEl = containerEl;
    this.baseUrl = baseUploadsUrl;
    this.handleDocumentClickBound = this.handleDocumentClick.bind(this);
  }

  init(inputEl: HTMLInputElement): void {
    this.inputEl = inputEl;

    const html = (Template({}) as unknown as string) ?? '';
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html.trim();

    this.rootEl = wrapper.firstElementChild as HTMLElement | null;
    if (!this.rootEl) return;

    this.usersListEl = this.rootEl.querySelector(
      '.navbar-search-modal__list--users',
    ) as HTMLElement | null;

    this.communitiesListEl = this.rootEl.querySelector(
      '.navbar-search-modal__list--communities',
    ) as HTMLElement | null;

    this.showAllBtn = this.rootEl.querySelector('.navbar-search-modal__more') as HTMLElement | null;

    this.containerEl.appendChild(this.rootEl);

    this.inputEl.addEventListener('focus', () => this.open());
    this.inputEl.addEventListener('input', () => this.handleInput());

    this.inputEl.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.close();
        this.inputEl?.blur();
      }
    });

    this.showAllBtn?.addEventListener('click', () => {
      const q = (this.inputEl?.value ?? '').trim();

      sessionStorage.setItem('globalSearchQuery', q);

      this.close();

      const url = q ? `/search?q=${encodeURIComponent(q)}` : '/search';
      navigateTo(url);
    });
  }

  open(): void {
    if (!this.rootEl) return;

    this.rootEl.classList.add('navbar-search-modal--open');

    if (!this.loadedInitial) {
      void this.loadInitial();
    }

    document.addEventListener('click', this.handleDocumentClickBound);
  }

  close(): void {
    if (!this.rootEl) return;

    this.rootEl.classList.remove('navbar-search-modal--open');
    document.removeEventListener('click', this.handleDocumentClickBound);
  }

  toggle(): void {
    if (!this.rootEl) return;

    if (this.rootEl.classList.contains('navbar-search-modal--open')) {
      this.close();
    } else {
      this.open();
      this.inputEl?.focus();
    }
  }

  private handleDocumentClick(e: MouseEvent): void {
    if (!this.rootEl) return;

    const target = e.target;
    if (!(target instanceof Node)) return;

    if (!this.rootEl.contains(target) && !this.containerEl.contains(target)) {
      this.close();
    }
  }

  private handleInput(): void {
    const value = (this.inputEl?.value ?? '').trim();
    this.currentQuery = value;
    this.currentPage = 1;

    if (this.debounceTimer != null) {
      window.clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = window.setTimeout(() => {
      if (!value) void this.loadInitial();
      else void this.runSearch(value);
    }, 300);
  }

  private avatarUrl(path: string | null | undefined): string {
    if (!path || path === 'null') return '/public/globalImages/DefaultAvatar.svg';
    return `${this.baseUrl}${path}`;
  }

  private renderUsers(users: ProfileEntity[], { append = false }: RenderUsersOptions = {}): void {
    if (!this.usersListEl) return;

    if (!append) this.usersListEl.innerHTML = '';

    if (!users || users.length === 0) {
      if (!append) {
        const empty = document.createElement('div');
        empty.textContent = 'Ничего не найдено';
        empty.style.padding = '4px 0';
        this.usersListEl.appendChild(empty);
      }
      return;
    }

    users.forEach((user) => {
      const row = document.createElement('div');
      row.className = 'navbar-search-item';

      const left = document.createElement('div');
      left.className = 'navbar-search-item__left';

      const html = templateAvatar({
        avatarPath: this.avatarUrl(user.avatarPath),
        fullName: user.fullName || 'Без имени',
      });

      left.insertAdjacentHTML('beforeend', html);

      const btn = document.createElement('button');
      btn.className = 'navbar-search-item__action';

      const status = (user.status ?? user.type ?? null) as UserStatus | string | null;

      if (status === 'accepted') {
        btn.textContent = 'У вас в друзьях';
        btn.classList.add('navbar-search-item__action--muted');
      } else if (status === 'pending' || status === 'sent') {
        btn.textContent = 'Заявка отправлена';
        btn.classList.add('navbar-search-item__action--muted');
      } else {
        btn.textContent = 'Добавить в друзья';
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          try {
            if (user.userID == null) return;
            await sendFriendRequest(user.userID);
            btn.textContent = 'Заявка отправлена';
            btn.classList.add('navbar-search-item__action--muted');
            btn.onclick = null;
          } catch (err) {
            console.error('[NavbarSearchModal] Ошибка отправки заявки', err);
          }
        });
      }

      row.addEventListener('click', (e) => {
        const t = e.target;
        if (t instanceof Element && t.closest('.navbar-search-item__action')) return;
        this.close();
        if (user.userID != null) navigateTo(`/profile/${user.userID}`);
      });

      row.appendChild(left);
      row.appendChild(btn);
      this.usersListEl?.appendChild(row);
    });
  }

  private renderCommunities(
    communities: CommunityEntity[],
    { append = false }: RenderCommunitiesOptions = {},
  ): void {
    if (!this.communitiesListEl) return;

    if (!append) this.communitiesListEl.innerHTML = '';

    if (!communities || communities.length === 0) {
      if (!append) {
        const empty = document.createElement('div');
        empty.textContent = 'Ничего не найдено';
        empty.style.padding = '4px 0';
        this.communitiesListEl.appendChild(empty);
      }
      return;
    }

    communities.forEach((community) => {
      const row = document.createElement('div');
      row.className = 'navbar-search-item';

      const left = document.createElement('div');
      left.className = 'navbar-search-item__left';

      const avatar =
        community.avatarPath ||
        community.avatar ||
        community.avatarURL ||
        community.iconPath ||
        null;

      const html = templateAvatar({
        avatarPath: this.avatarUrl(avatar),
        fullName: community.name || community.title || 'Сообщество',
      });

      left.insertAdjacentHTML('beforeend', html);

      const right = document.createElement('div');
      right.className = 'navbar-search-item__action navbar-search-item__action--muted';
      right.textContent =
        community.subscriptionType === 'subscriber' ? 'Вы подписаны' : '';

      row.addEventListener('click', () => {
        this.close();
        const id = community.id ?? community.communityID;
        if (id != null) navigateTo(`/community/${id}`);
      });

      row.appendChild(left);
      row.appendChild(right);

      this.communitiesListEl?.appendChild(row);
    });
  }

  private async loadInitial(): Promise<void> {
    try {
      this.currentQuery = '';
      this.currentPage = 1;

      const [friendsRaw, possibleRaw, myCommRaw, otherCommRaw] = await Promise.all([
        getFriends(1, 5),
        getPossibleFriends(1, 5),
        getMyCommunities(1, 5),
        getOtherCommunities(1, 5),
      ]);

      const friendsArr = (Array.isArray(friendsRaw) ? friendsRaw : []) as unknown[];
      const possibleArr = (Array.isArray(possibleRaw) ? possibleRaw : []) as unknown[];
      const myCommArr = (Array.isArray(myCommRaw) ? myCommRaw : []) as unknown[];
      const otherCommArr = (Array.isArray(otherCommRaw) ? otherCommRaw : []) as unknown[];

      const friends: ProfileEntity[] = friendsArr.map((u) => {
        const obj = u as any;
        return {
          userID: toNumberOrNull(obj.userID),
          fullName: toStringOrEmpty(obj.fullName).trim() || 'Без имени',
          avatarPath: toStringOrNull(obj.avatarPath),
          status: 'accepted',
        };
      });

      const possible: ProfileEntity[] = possibleArr.map((u) => {
        const obj = u as any;
        return {
          userID: toNumberOrNull(obj.userID),
          fullName: toStringOrEmpty(obj.fullName).trim() || 'Без имени',
          avatarPath: toStringOrNull(obj.avatarPath),
          status: (obj.status as string) || 'notFriends',
          type: obj.type ?? null,
        };
      });

      const usersTop3 = [...friends, ...possible].slice(0, 3);

      const myCommunities: CommunityEntity[] = myCommArr.map((c) => {
        const obj = c as any;
        return {
          id: toNumberOrNull(obj.id),
          communityID: toNumberOrNull(obj.communityID),
          name: toStringOrEmpty(obj.name || obj.title).trim() || 'Сообщество',
          title: obj.title ?? null,
          avatarPath: obj.avatarPath ?? null,
          avatar: obj.avatar ?? null,
          avatarURL: obj.avatarURL ?? null,
          iconPath: obj.iconPath ?? null,
          subscriptionType: 'subscriber',
        };
      });

      const otherCommunities: CommunityEntity[] = otherCommArr.map((c) => {
        const obj = c as any;
        return {
          id: toNumberOrNull(obj.id),
          communityID: toNumberOrNull(obj.communityID),
          name: toStringOrEmpty(obj.name || obj.title).trim() || 'Сообщество',
          title: obj.title ?? null,
          avatarPath: obj.avatarPath ?? null,
          avatar: obj.avatar ?? null,
          avatarURL: obj.avatarURL ?? null,
          iconPath: obj.iconPath ?? null,
          subscriptionType: 'recommended',
        };
      });

      const communitiesTop3 = [...myCommunities, ...otherCommunities].slice(0, 3);

      this.loadedInitial = true;

      this.renderUsers(usersTop3);
      this.renderCommunities(communitiesTop3);
    } catch (e) {
      console.error('[NavbarSearchModal] Ошибка получения начальных друзей/сообществ', e);
    }
  }

  private async runSearch(query: string): Promise<void> {
    try {
      const types = ['accepted', 'pending', 'notFriends'] as const;
      const perTypeLimit = 5;

      const profileResponses = await Promise.all(
        types.map((t) => (searchProfiles as any)(query, t, 1, perTypeLimit)),
      );

      const mergedUsers: ProfileEntity[] = [];

      types.forEach((type, idx) => {
        const arr = (Array.isArray(profileResponses[idx]) ? profileResponses[idx] : []) as unknown[];
        arr.forEach((u) => {
          const obj = u as any;
          mergedUsers.push({
            userID: toNumberOrNull(obj.userID),
            fullName: toStringOrEmpty(obj.fullName).trim() || 'Без имени',
            avatarPath: toStringOrNull(obj.avatarPath),
            status: (obj.status as string) || type,
            type: obj.type ?? null,
          });
        });
      });

      const usersTop3 = mergedUsers.slice(0, 3);

      const [subRaw, otherRaw] = await Promise.all([
        searchCommunities({ name: query, type: 'subscriber', page: 1, limit: 3 }),
        searchCommunities({ name: query, type: 'recommended', page: 1, limit: 3 }),
      ]);

      const subArr = (Array.isArray(subRaw) ? subRaw : []) as unknown[];
      const otherArr = (Array.isArray(otherRaw) ? otherRaw : []) as unknown[];

      const subscriberCommunities: CommunityEntity[] = subArr.map((c) => {
        const obj = c as any;
        return {
          id: toNumberOrNull(obj.id),
          communityID: toNumberOrNull(obj.communityID),
          name: toStringOrEmpty(obj.name || obj.title).trim() || 'Сообщество',
          title: obj.title ?? null,
          avatarPath: obj.avatarPath ?? null,
          avatar: obj.avatar ?? null,
          avatarURL: obj.avatarURL ?? null,
          iconPath: obj.iconPath ?? null,
          subscriptionType: 'subscriber',
        };
      });

      const otherCommunities: CommunityEntity[] = otherArr.map((c) => {
        const obj = c as any;
        return {
          id: toNumberOrNull(obj.id),
          communityID: toNumberOrNull(obj.communityID),
          name: toStringOrEmpty(obj.name || obj.title).trim() || 'Сообщество',
          title: obj.title ?? null,
          avatarPath: obj.avatarPath ?? null,
          avatar: obj.avatar ?? null,
          avatarURL: obj.avatarURL ?? null,
          iconPath: obj.iconPath ?? null,
          subscriptionType: 'recommended',
        };
      });

      const communitiesTop3 = [...subscriberCommunities, ...otherCommunities].slice(0, 3);

      this.renderUsers(usersTop3);
      this.renderCommunities(communitiesTop3);
    } catch (e) {
      console.error('[NavbarSearchModal] Ошибка поиска', e);
    }
  }
}
