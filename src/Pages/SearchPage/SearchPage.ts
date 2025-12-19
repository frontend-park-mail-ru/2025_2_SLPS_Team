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
  acceptFriend,
  rejectFriendRequest,
} from '../../shared/api/friendsApi';

import {
  getMyCommunities,
  getOtherCommunities,
  searchCommunities,
  toggleCommunitySubscription,
} from '../../shared/api/communityApi';

import { API_BASE_URL } from '../../shared/api/client';
import { renderCommunityCard } from '../../components/molecules/CommunityCard/CommunityCard';

import type { ProfileDTO, FriendsSearchBackendType } from '../../shared/types/friends';

type Tab = 'all' | 'users' | 'communities';
type FriendStatus = 'accepted' | 'pending' | 'sent' | 'notFriends';

type CommunityDTO = {
  id: number;
  name: string;
  description: string;
  avatarPath?: string | null;
  subscribersCount?: number;
  isSubscribed?: boolean;
  subscriptionType?: string;
};

type UserView = ProfileDTO & { __friendStatus?: FriendStatus };

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

function isFriendStatus(v: any): v is FriendStatus {
  return v === 'accepted' || v === 'pending' || v === 'sent' || v === 'notFriends';
}

function priority(s: FriendStatus): number {
  if (s === 'accepted') return 4;
  if (s === 'pending') return 3;
  if (s === 'sent') return 2;
  return 1;
}

function uploadsUrl(path?: string | null): string {
  if (!path || path === 'null') return '/public/globalImages/DefaultAvatar.svg';
  const s = String(path).trim();
  if (!s) return '/public/globalImages/DefaultAvatar.svg';
  if (s.startsWith('http://') || s.startsWith('https://')) return s;

  const origin = API_BASE_URL.replace(/\/api$/i, '');

  if (s.startsWith('/api/uploads/')) return `${origin}${s}`;
  if (s.startsWith('api/uploads/')) return `${API_BASE_URL}/${s.replace(/^api\//, '')}`;
  if (s.startsWith('/uploads/')) return `${API_BASE_URL}${s}`;
  if (s.startsWith('uploads/')) return `${API_BASE_URL}/${s}`;
  if (s.includes('/')) return `${origin}/${s.replace(/^\//, '')}`;

  return `${API_BASE_URL}/uploads/${s}`;
}

function userAvatar(u: any): string {
  return uploadsUrl(u?.avatarPath ?? u?.avatar ?? null);
}

function communitySubscribed(c: CommunityDTO): boolean {
  return c.isSubscribed === true || c.subscriptionType === 'subscriber';
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

  private cachedUsers: UserView[] | null = null;
  private cachedCommunities: CommunityDTO[] | null = null;

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

  private async loadAndRender(): Promise<void> {
    this.clearLists();

    if (!this.q) {
      const [users, communities] = await Promise.all([this.ensureUsers(), this.ensureCommunities()]);
      this.renderUsers(users);
      this.renderCommunities(communities);
      return;
    }

    const [usersFound, communitiesFound] = await Promise.all([
      this.searchUsersAllStatuses(this.q).catch(() => [] as UserView[]),
      this.searchCommunitiesSafe(this.q).catch(() => [] as CommunityDTO[]),
    ]);

    this.renderUsers(usersFound);
    this.renderCommunities(communitiesFound);
  }

  private async ensureUsers(): Promise<UserView[]> {
    if (this.cachedUsers) return this.cachedUsers;

    const [friends, possible] = await Promise.all([
      getFriends().catch(() => [] as ProfileDTO[]),
      getPossibleFriends().catch(() => [] as ProfileDTO[]),
    ]);

    const mappedFriends = friends.map((u) => ({ ...(u as any), __friendStatus: 'accepted' as FriendStatus }));
    const mappedPossible = possible.map((u) => ({ ...(u as any), __friendStatus: 'notFriends' as FriendStatus }));

    this.cachedUsers = uniqById([...mappedFriends, ...mappedPossible], getUserId);
    return this.cachedUsers;
  }

  private async ensureCommunities(): Promise<CommunityDTO[]> {
    if (this.cachedCommunities) return this.cachedCommunities;

    const [mine, other] = await Promise.all([
      getMyCommunities<CommunityDTO>().catch(() => [] as CommunityDTO[]),
      getOtherCommunities<CommunityDTO>().catch(() => [] as CommunityDTO[]),
    ]);

    this.cachedCommunities = uniqById([...mine, ...other], (c) => c.id);
    return this.cachedCommunities;
  }

  private async searchUsersAllStatuses(q: string): Promise<UserView[]> {
    const statuses: FriendStatus[] = ['accepted', 'pending', 'sent', 'notFriends'];

    const parts = await Promise.all(
      statuses.map(async (s) => {
        const data = await searchProfiles(q, s as unknown as FriendsSearchBackendType, 1, 20).catch(
          () => [] as ProfileDTO[],
        );
        return data.map((u) => ({ ...(u as any), __friendStatus: s }));
      }),
    );

    const merged = parts.flat();
    const byId = new Map<number, UserView>();

    for (const u of merged) {
      const id = getUserId(u);
      if (!id) continue;
      const st = isFriendStatus((u as any).__friendStatus) ? (u as any).__friendStatus : 'notFriends';
      const prev = byId.get(id);
      if (!prev) {
        byId.set(id, u);
        continue;
      }
      const prevSt = isFriendStatus((prev as any).__friendStatus) ? (prev as any).__friendStatus : 'notFriends';
      if (priority(st) > priority(prevSt)) byId.set(id, u);
    }

    return Array.from(byId.values());
  }

  private async searchCommunitiesSafe(q: string): Promise<CommunityDTO[]> {
    try {
      const data = await searchCommunities<CommunityDTO>({ name: q, page: 1, limit: 20 } as any);
      return Array.isArray(data) ? uniqById(data, (c) => c.id) : [];
    } catch {
      const [sub, rec] = await Promise.all([
        searchCommunities<CommunityDTO>({ name: q, type: 'subscriber', page: 1, limit: 20 }).catch(() => []),
        searchCommunities<CommunityDTO>({ name: q, type: 'recommended', page: 1, limit: 20 }).catch(() => []),
      ]);
      return uniqById([...sub, ...rec], (c) => c.id);
    }
  }

  private renderUsers(items: UserView[]): void {
    if (this.tab === 'communities') return;

    if (!items.length) {
      this.usersList.appendChild(this.makeEmpty('Пользователи не найдены'));
      return;
    }

    const frag = document.createDocumentFragment();
    for (const u of items as any[]) {
      const id = getUserId(u);
      const name = getUserName(u);
      const status: FriendStatus = isFriendStatus(u.__friendStatus) ? u.__friendStatus : 'notFriends';
      frag.appendChild(this.renderUserRow(id, name, userAvatar(u), status));
    }
    this.usersList.appendChild(frag);
  }

  private renderCommunities(items: CommunityDTO[]): void {
    if (this.tab === 'users') return;

    if (!items.length) {
      this.communitiesList.appendChild(this.makeEmpty('Сообщества не найдены'));
      return;
    }

    const frag = document.createDocumentFragment();
    for (const c of items) {
      const card = renderCommunityCard({
        id: c.id,
        name: c.name,
        description: c.description,
        subscribers: String(c.subscribersCount ?? 0),
        avatarPath: uploadsUrl(c.avatarPath ?? null),
        isSubscribed: communitySubscribed(c),
        onToggleSubscribe: (id: string | number) => void this.onToggleSubscribe(Number(id), c),
        onClick: (id: string | number) => navigateTo(`/community/${Number(id)}`),
      });
      if (card) frag.appendChild(card);
    }
    this.communitiesList.appendChild(frag);
  }

  private async onToggleSubscribe(id: number, model: CommunityDTO): Promise<void> {
    const prev = communitySubscribed(model);
    model.isSubscribed = !prev;
    try {
      const res = await toggleCommunitySubscription(id, prev);
      model.isSubscribed = res.isSubscribed;
      model.subscriptionType = res.isSubscribed ? 'subscriber' : 'recommended';
    } catch {
      model.isSubscribed = prev;
      model.subscriptionType = prev ? 'subscriber' : 'recommended';
    }
    await this.loadAndRender();
  }

  private renderUserRow(id: number, name: string, avatar: string, status: FriendStatus): HTMLElement {
    const row = document.createElement('div');
    row.className = 'navbar-search-item';

    const left = document.createElement('div');
    left.className = 'navbar-search-item__left';

    const img = document.createElement('img');
    img.className = 'navbar-search-item__avatar';
    img.src = avatar;
    img.alt = name;

    const title = document.createElement('div');
    title.className = 'navbar-search-item__name';
    title.textContent = name;

    left.appendChild(img);
    left.appendChild(title);

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
      msg.addEventListener('click', (e) => {
        e.stopPropagation();
        sessionStorage.setItem('openChatUserId', String(id));
        navigateTo('/chats');
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
          await deleteFriend(id);
          await this.loadAndRender();
        } finally {
          cancel.disabled = false;
        }
      });
      actions.appendChild(cancel);
    } else if (status === 'pending') {
      const accept = mkBtn('Принять');
      accept.addEventListener('click', async (e) => {
        e.stopPropagation();
        accept.disabled = true;
        try {
          await acceptFriend(id);
          await this.loadAndRender();
        } finally {
          accept.disabled = false;
        }
      });

      const reject = mkBtn('Отклонить');
      reject.addEventListener('click', async (e) => {
        e.stopPropagation();
        reject.disabled = true;
        try {
          await rejectFriendRequest(id);
          await this.loadAndRender();
        } finally {
          reject.disabled = false;
        }
      });

      actions.appendChild(accept);
      actions.appendChild(reject);
    } else {
      const add = mkBtn('Добавить');
      add.addEventListener('click', async (e) => {
        e.stopPropagation();
        add.disabled = true;
        try {
          await sendFriendRequest(id);
          await this.loadAndRender();
        } finally {
          add.disabled = false;
        }
      });
      actions.appendChild(add);
    }

    row.appendChild(left);
    row.appendChild(actions);

    row.addEventListener('click', () => navigateTo(`/profile/${id}`));
    return row;
  }

  private makeEmpty(text: string): HTMLElement {
    const el = document.createElement('div');
    el.textContent = text;
    el.style.opacity = '0.7';
    return el;
  }
}
