import BasePage from '../BasePage';
import Template from './SearchPage.hbs';
import './SearchPage.css';

import SearchStatsTemplate from './SearchStats.hbs';
import '../../components/molecules/FriendsStats/FriendsStats.css';
import '../../components/molecules/NavbarSearchModal/NavbarSearchModal.css';

import { navigateTo } from '../../app/router/navigateTo';

import {
  getFriends,
  getPossibleFriends,
  searchProfiles,
  sendFriendRequest,
  deleteFriend,
} from '../../shared/api/friendsApi';

import {
  getMyCommunities,
  getOtherCommunities,
  searchCommunities,
  toggleCommunitySubscription,
} from '../../shared/api/communityApi';

import type { ProfileDTO, FriendsSearchBackendType } from '../../shared/types/friends';

type Tab = 'all' | 'users' | 'communities';

type CommunityLike = {
  id?: number;
  communityID?: number;
  name?: string;
  groupName?: string;
  avatar?: string | null;
  avatarPath?: string | null;
  photo?: string | null;
  isSubscribed?: boolean;
  subscriptionType?: string;
};

function debounce(fn: () => void, ms: number) {
  let t: number | null = null;
  return () => {
    if (t !== null) window.clearTimeout(t);
    t = window.setTimeout(fn, ms);
  };
}

function uniqById<T>(items: T[], getId: (x: T) => number): T[] {
  const seen = new Set<number>();
  const out: T[] = [];
  for (const x of items) {
    const id = getId(x);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(x);
  }
  return out;
}

function getUserId(u: any): number {
  return typeof u?.userID === 'number' ? u.userID : u?.id ?? 0;
}

function getUserName(u: any): string {
  return u?.fullName ?? u?.full_name ?? u?.login ?? 'Пользователь';
}

function getCommunityId(c: any): number {
  return typeof c?.id === 'number' ? c.id : c?.communityID ?? 0;
}

function getCommunityName(c: any): string {
  return c?.name ?? c?.groupName ?? 'Сообщество';
}

function isCommunitySubscribed(c: any): boolean {
  return c?.isSubscribed === true || c?.subscriptionType === 'subscriber';
}

type FriendStatus = 'accepted' | 'pending' | 'sent' | 'notFriends';

function statusPriority(s: FriendStatus): number {
  if (s === 'accepted') return 4;
  if (s === 'pending') return 3;
  if (s === 'sent') return 2;
  return 1;
}

export default class SearchPage extends BasePage {
  private wrapper!: HTMLDivElement;
  private root!: HTMLElement;

  private input!: HTMLInputElement;
  private usersList!: HTMLElement;
  private communitiesList!: HTMLElement;
  private statsRoot!: HTMLElement;

  private usersSection!: HTMLElement;
  private communitiesSection!: HTMLElement;

  private tab: Tab = 'all';
  private q = '';

  private allUsers: ProfileDTO[] | null = null;
  private allCommunities: CommunityLike[] | null = null;

  async render(): Promise<void> {
    document.getElementById('page-wrapper')?.remove();

    this.wrapper = document.createElement('div');
    this.wrapper.id = 'page-wrapper';

    const tmp = document.createElement('div');
    tmp.innerHTML = Template({});
    this.root = tmp.firstElementChild as HTMLElement;

    this.wrapper.appendChild(this.root);
    this.rootElement.appendChild(this.wrapper);

    this.input = this.root.querySelector('.search-page__input') as HTMLInputElement;
    this.usersList = this.root.querySelector('.search-page__list--users') as HTMLElement;
    this.communitiesList = this.root.querySelector('.search-page__list--communities') as HTMLElement;
    this.statsRoot = this.root.querySelector('.search-stats') as HTMLElement;

    this.usersSection = this.root.querySelector('.search-section--users') as HTMLElement;
    this.communitiesSection = this.root.querySelector('.search-section--communities') as HTMLElement;

    const qFromUrl = new URLSearchParams(window.location.search).get('q') ?? '';
    const qFromStorage = sessionStorage.getItem('globalSearchQuery') ?? '';
    this.q = (qFromUrl || qFromStorage).trim();
    this.input.value = this.q;

    this.renderStats();

    this.statsRoot.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('.friends-stats__item') as HTMLButtonElement | null;
      if (!btn) return;
      this.setTab((btn.dataset.type as Tab) ?? 'all');
    });

    const onInput = debounce(() => {
      this.q = this.input.value.trim();
      sessionStorage.setItem('globalSearchQuery', this.q);
      const url = this.q ? `/search?q=${encodeURIComponent(this.q)}` : '/search';
      window.history.replaceState({}, '', url);
      void this.loadAndRender();
    }, 300);

    this.input.addEventListener('input', onInput);

    this.setTab('all');
    await this.loadAndRender();
  }

  private setTab(tab: Tab): void {
    this.tab = tab;

    this.usersSection.style.display = tab === 'communities' ? 'none' : '';
    this.communitiesSection.style.display = tab === 'users' ? 'none' : '';

    this.renderStats();
  }

  private renderStats(): void {
    this.statsRoot.innerHTML = SearchStatsTemplate({
      isAll: this.tab === 'all',
      isUsers: this.tab === 'users',
      isCommunities: this.tab === 'communities',
    });
  }

  private clearLists(): void {
    this.usersList.innerHTML = '';
    this.communitiesList.innerHTML = '';
  }

  private avatarUrl(path: string | null | undefined): string {
    if (!path || path === 'null') return '/public/globalImages/DefaultAvatar.svg';
    const s = String(path).trim();
    if (!s) return '/public/globalImages/DefaultAvatar.svg';
    if (s.startsWith('http://') || s.startsWith('https://')) return s;

    const apiBase = (process.env.API_BASE_URL ?? '').replace(/\/$/, '');
    const origin = apiBase.replace(/\/api$/i, '');

    if (s.startsWith('api/uploads/')) {
      return `${apiBase}/${s.replace(/^api\//, '')}`;
    }

    if (s.startsWith('/api/uploads/')) {
      return `${origin}${s}`;
    }

    if (s.startsWith('/uploads/')) {
      return `${apiBase}${s}`;
    }
    if (s.startsWith('uploads/')) {
      return `${apiBase}/${s}`;
    }

    if (s.startsWith('/')) return `${origin}${s}`;
    return `${origin}/${s}`;
  }

  private async loadAndRender(): Promise<void> {
    this.clearLists();

    if (!this.q) {
      const [users, communities] = await Promise.all([
        this.ensureAllUsers(),
        this.ensureAllCommunities(),
      ]);

      this.renderUsers(users);
      this.renderCommunities(communities);
      return;
    }

    const [usersFound, communitiesFound] = await Promise.all([
      this.searchUsersAllTypes(this.q).catch(() => [] as any[]),
      this.searchCommunitiesSafe(this.q).catch(() => [] as CommunityLike[]),
    ]);

    this.renderUsers(usersFound as any);
    this.renderCommunities(communitiesFound);
  }

  private async searchUsersAllTypes(q: string): Promise<any[]> {
    const types: FriendStatus[] = ['accepted', 'pending', 'sent', 'notFriends'];

    const parts = await Promise.all(
      types.map(async (t) => {
        const data = await searchProfiles(q, t as unknown as FriendsSearchBackendType, 1, 20).catch(() => []);
        return (data as any[]).map((u) => ({ ...u, __friendStatus: t as FriendStatus }));
      }),
    );

    const merged = parts.flat();

    const byId = new Map<number, any>();
    for (const u of merged) {
      const id = getUserId(u);
      if (!id) continue;
      const prev = byId.get(id);
      if (!prev) {
        byId.set(id, u);
      } else {
        const a = prev.__friendStatus as FriendStatus;
        const b = u.__friendStatus as FriendStatus;
        if (statusPriority(b) > statusPriority(a)) byId.set(id, u);
      }
    }
    return Array.from(byId.values());
  }

  private async searchCommunitiesSafe(q: string): Promise<CommunityLike[]> {
    try {
      const data = await searchCommunities<CommunityLike>({ name: q, page: 1, limit: 20 } as any);
      return Array.isArray(data) ? uniqById(data, getCommunityId) : [];
    } catch {
      const [sub, rec] = await Promise.all([
        searchCommunities<CommunityLike>({ name: q, type: 'subscriber', page: 1, limit: 20 }).catch(() => []),
        searchCommunities<CommunityLike>({ name: q, type: 'recommended', page: 1, limit: 20 }).catch(() => []),
      ]);
      return uniqById([...sub, ...rec], getCommunityId);
    }
  }

  private async ensureAllUsers(): Promise<ProfileDTO[]> {
    if (this.allUsers) return this.allUsers;

    const [possible, friends] = await Promise.all([
      getPossibleFriends().catch(() => [] as ProfileDTO[]),
      getFriends().catch(() => [] as ProfileDTO[]),
    ]);

    this.allUsers = uniqById([...possible, ...friends], getUserId);
    return this.allUsers;
  }

  private async ensureAllCommunities(): Promise<CommunityLike[]> {
    if (this.allCommunities) return this.allCommunities;

    const [other, mine] = await Promise.all([
      getOtherCommunities<CommunityLike>().catch(() => [] as CommunityLike[]),
      getMyCommunities<CommunityLike>().catch(() => [] as CommunityLike[]),
    ]);

    this.allCommunities = uniqById([...other, ...mine], getCommunityId);
    return this.allCommunities;
  }

  private renderUsers(items: any[]): void {
    if (this.tab === 'communities') return;

    if (!items.length) {
      this.usersList.appendChild(this.makeEmpty('Пользователи не найдены'));
      return;
    }

    for (const u of items) {
      const id = getUserId(u);
      const status: FriendStatus = (u.__friendStatus ?? 'notFriends') as FriendStatus;

      const row = this.makeUserRow(
        getUserName(u),
        u.avatarPath ?? u.avatar ?? null,
        status,
        () => navigateTo(`/profile/${id}`),
        async () => {
          sessionStorage.setItem('openChatUserId', String(id));
          navigateTo('/chats');
        },
        async () => {
          await sendFriendRequest(id);
        },
        async () => {
          await deleteFriend(id); 
        },
      );

      this.usersList.appendChild(row);
    }
  }

  private renderCommunities(items: CommunityLike[]): void {
    if (this.tab === 'users') return;

    if (!items.length) {
      this.communitiesList.appendChild(this.makeEmpty('Сообщества не найдены'));
      return;
    }

    for (const c of items as any[]) {
      const id = getCommunityId(c);

      const row = this.makeCommunityRow(
        getCommunityName(c),
        c.avatar ?? c.avatarPath ?? c.photo ?? null,
        isCommunitySubscribed(c),
        () => navigateTo(`/community/${id}`),
        async (subscribed) => {
          const res = await toggleCommunitySubscription(id, subscribed);
          c.isSubscribed = res.isSubscribed;
          c.subscriptionType = res.isSubscribed ? 'subscriber' : 'recommended';
          return res.isSubscribed;
        },
      );

      this.communitiesList.appendChild(row);
    }
  }

  private makeUserRow(
    title: string,
    avatar: string | null,
    status: FriendStatus,
    onClick: () => void,
    onMessage: () => Promise<void>,
    onAdd: () => Promise<void>,
    onCancelOrRemove: () => Promise<void>,
  ): HTMLElement {
    const row = document.createElement('div');
    row.className = 'navbar-search-item';

    const left = document.createElement('div');
    left.className = 'navbar-search-item__left';

    const img = document.createElement('img');
    img.className = 'navbar-search-item__avatar';
    img.src = this.avatarUrl(avatar);
    img.alt = title;

    const name = document.createElement('div');
    name.className = 'navbar-search-item__name';
    name.textContent = title;

    left.appendChild(img);
    left.appendChild(name);

    const actions = document.createElement('div');
    actions.className = 'navbar-search-item__actions';

    const mkBtn = (text: string, muted = false) => {
      const b = document.createElement('button');
      b.className = 'navbar-search-item__action';
      b.textContent = text;
      if (muted) b.classList.add('navbar-search-item__action--muted');
      return b;
    };

    if (status === 'accepted') {
      const msg = mkBtn('Сообщение');
      msg.addEventListener('click', async (e) => {
        e.stopPropagation();
        await onMessage();
      });

      const fr = mkBtn('В друзьях', true);
      actions.appendChild(msg);
      actions.appendChild(fr);
    } else if (status === 'sent') {
      const cancel = mkBtn('Отменить');
      cancel.addEventListener('click', async (e) => {
        e.stopPropagation();
        cancel.disabled = true;
        try {
          await onCancelOrRemove();
          cancel.textContent = 'Отменено';
          cancel.classList.add('navbar-search-item__action--muted');
        } finally {
          cancel.disabled = false;
        }
      });
      actions.appendChild(cancel);
    } else if (status === 'pending') {
      actions.appendChild(mkBtn('Ожидает вас', true));
    } else {
      const add = mkBtn('Добавить');
      add.addEventListener('click', async (e) => {
        e.stopPropagation();
        add.disabled = true;
        try {
          await onAdd();
          add.textContent = 'Заявка отправлена';
          add.classList.add('navbar-search-item__action--muted');
        } finally {
          add.disabled = false;
        }
      });
      actions.appendChild(add);
    }

    row.appendChild(left);
    row.appendChild(actions);
    row.addEventListener('click', onClick);
    return row;
  }

  private makeCommunityRow(
    title: string,
    avatar: string | null,
    subscribed: boolean,
    onClick: () => void,
    onToggle: (isSubscribed: boolean) => Promise<boolean>,
  ): HTMLElement {
    const row = document.createElement('div');
    row.className = 'navbar-search-item';

    const left = document.createElement('div');
    left.className = 'navbar-search-item__left';

    const img = document.createElement('img');
    img.className = 'navbar-search-item__avatar';
    img.src = this.avatarUrl(avatar);
    img.alt = title;

    const name = document.createElement('div');
    name.className = 'navbar-search-item__name';
    name.textContent = title;

    left.appendChild(img);
    left.appendChild(name);

    const actions = document.createElement('div');
    actions.className = 'navbar-search-item__actions';

    const btn = document.createElement('button');
    btn.className = 'navbar-search-item__action';
    btn.textContent = subscribed ? 'Отписаться' : 'Подписаться';

    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      btn.disabled = true;
      try {
        const now = await onToggle(subscribed);
        subscribed = now;
        btn.textContent = now ? 'Отписаться' : 'Подписаться';
      } finally {
        btn.disabled = false;
      }
    });

    actions.appendChild(btn);

    row.appendChild(left);
    row.appendChild(actions);
    row.addEventListener('click', onClick);
    return row;
  }

  private makeEmpty(text: string): HTMLElement {
    const el = document.createElement('div');
    el.textContent = text;
    el.style.opacity = '0.75';
    el.style.padding = '6px 0';
    return el;
  }
}
