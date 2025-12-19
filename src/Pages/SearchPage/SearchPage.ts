import BasePage from '../BasePage';
import Template from './SearchPage.hbs';
import './SearchPage.css';

import SearchStatsTemplate from './SearchStats.hbs';
import '../../components/molecules/FriendsStats/FriendsStats.css';

import { NotificationManager } from '../../components/organisms/NotificationsBlock/NotificationsManager';

import { navigateTo } from '../../app/router/navigateTo';
import { API_BASE_URL } from '../../shared/api/client';

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

import type { ProfileDTO, FriendsSearchBackendType } from '../../shared/types/friends';

const notifier = new NotificationManager();

type Tab = 'all' | 'users' | 'communities';
type FriendStatus = 'accepted' | 'pending' | 'sent' | 'notFriends';

type CommunityDTO = {
  id: number;
  name: string;
  description?: string | null;
  avatarPath?: string | null;
  subscribersCount?: number | null;
  subscriptionType?: 'subscriber' | 'recommended';
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

function pluralSubscribers(n: number): string {
  const x = Math.abs(n) % 100;
  const y = x % 10;
  if (x >= 11 && x <= 19) return `${n} подписчиков`;
  if (y === 1) return `${n} подписчик`;
  if (y >= 2 && y <= 4) return `${n} подписчика`;
  return `${n} подписчиков`;
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

    this.input.addEventListener(
      'input',
      debounce(() => {
        this.q = this.input.value.trim();
        sessionStorage.setItem('globalSearchQuery', this.q);
        const url = this.q ? `/search?q=${encodeURIComponent(this.q)}` : '/search';
        window.history.replaceState({}, '', url);
        void this.loadAndRender();
      }, 300),
    );

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
      this.searchCommunitiesTwoTypes(this.q).catch(() => [] as CommunityDTO[]),
    ]);

    this.renderUsers(usersFound);
    this.renderCommunities(communitiesFound);
  }

  private async ensureUsers(): Promise<UserView[]> {
    if (this.cachedUsers) return this.cachedUsers;

    const [friends, possible, sent, pending] = await Promise.all([
      getFriends().catch(() => [] as ProfileDTO[]),
      getPossibleFriends().catch(() => [] as ProfileDTO[]),
      searchProfiles(' ', 'sent' as unknown as FriendsSearchBackendType, 1, 50).catch(() => [] as ProfileDTO[]),
      searchProfiles(' ', 'pending' as unknown as FriendsSearchBackendType, 1, 50).catch(() => [] as ProfileDTO[]),
    ]);

    const mappedFriends = friends.map((u) => ({ ...(u as any), __friendStatus: 'accepted' as FriendStatus }));
    const mappedPossible = possible.map((u) => ({ ...(u as any), __friendStatus: 'notFriends' as FriendStatus }));
    const mappedSent = sent.map((u) => ({ ...(u as any), __friendStatus: 'sent' as FriendStatus }));
    const mappedPending = pending.map((u) => ({ ...(u as any), __friendStatus: 'pending' as FriendStatus }));

    const merged = [...mappedPossible, ...mappedSent, ...mappedPending, ...mappedFriends];

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

    this.cachedUsers = Array.from(byId.values());
    return this.cachedUsers;
  }

  private async ensureCommunities(): Promise<CommunityDTO[]> {
    if (this.cachedCommunities) return this.cachedCommunities;

    const [mine, other] = await Promise.all([
      getMyCommunities<CommunityDTO>(1, 50).catch(() => [] as CommunityDTO[]),
      getOtherCommunities<CommunityDTO>(1, 50).catch(() => [] as CommunityDTO[]),
    ]);

    const subs = (mine ?? []).map((c) => ({ ...c, subscriptionType: 'subscriber' as const }));
    const reco = (other ?? []).map((c) => ({ ...c, subscriptionType: 'recommended' as const }));

    this.cachedCommunities = uniqById([...subs, ...reco], (c) => c.id);
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

  private async searchCommunitiesTwoTypes(q: string): Promise<CommunityDTO[]> {
    const [subs, reco] = await Promise.all([
      searchCommunities<CommunityDTO>({ name: q, type: 'subscriber', page: 1, limit: 20 } as any).catch(
        () => [] as CommunityDTO[],
      ),
      searchCommunities<CommunityDTO>({ name: q, type: 'recommended', page: 1, limit: 20 } as any).catch(
        () => [] as CommunityDTO[],
      ),
    ]);

    const taggedSubs = (subs ?? []).map((c) => ({ ...c, subscriptionType: 'subscriber' as const }));
    const taggedReco = (reco ?? []).map((c) => ({ ...c, subscriptionType: 'recommended' as const }));

    return uniqById([...taggedSubs, ...taggedReco], (c) => c.id);
  }

  private renderUsers(items: UserView[]): void {
    if (this.tab === 'communities') return;

    if (!items.length) {
      this.usersList.appendChild(this.emptyRow('Пользователи не найдены'));
      return;
    }

    const frag = document.createDocumentFragment();
    for (const u of items as any[]) {
      const id = getUserId(u);
      const name = getUserName(u);
      const status: FriendStatus = isFriendStatus(u.__friendStatus) ? u.__friendStatus : 'notFriends';
      frag.appendChild(this.userRow(id, name, userAvatar(u), status));
    }
    this.usersList.appendChild(frag);
  }

  private renderCommunities(items: CommunityDTO[]): void {
    if (this.tab === 'users') return;

    if (!items.length) {
      this.communitiesList.appendChild(this.emptyRow('Сообщества не найдены'));
      return;
    }

    const frag = document.createDocumentFragment();
    for (const c of items) {
      frag.appendChild(this.communityRow(c));
    }
    this.communitiesList.appendChild(frag);
  }

  private communityRow(c: CommunityDTO): HTMLElement {
    const row = document.createElement('div');
    row.className = 'search-row';

    const left = document.createElement('div');
    left.className = 'search-row__left';

    const avatar = document.createElement('img');
    avatar.className = 'search-row__avatar';
    avatar.src = uploadsUrl(c.avatarPath ?? null);
    avatar.alt = c.name;

    const text = document.createElement('div');
    text.className = 'search-row__text';

    const title = document.createElement('div');
    title.className = 'search-row__title';
    title.textContent = c.name;

    const desc = document.createElement('div');
    desc.className = 'search-row__desc';
    desc.textContent = (c.description ?? '').trim();

    const meta = document.createElement('div');
    meta.className = 'search-row__meta';
    meta.textContent = pluralSubscribers(Number(c.subscribersCount ?? 0));

    text.appendChild(title);
    text.appendChild(desc);
    text.appendChild(meta);

    left.appendChild(avatar);
    left.appendChild(text);

    const right = document.createElement('div');
    right.className = 'search-row__actions';

    const btn = document.createElement('button');
    btn.className = 'search-row__btn';

    btn.textContent = c.subscriptionType === 'subscriber' ? 'Отписаться' : 'Подписаться';

    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      btn.disabled = true;

      try {
        const wasSub = c.subscriptionType === 'subscriber';
        const res = await toggleCommunitySubscription(c.id, wasSub);
        const nowSub = res.isSubscribed;

        notifier.show(
          nowSub ? 'Подписка оформлена' : 'Вы отписались',
          nowSub ? `Вы подписались на ${c.name}` : `Вы отписались от ${c.name}`,
          nowSub ? 'success' : 'warning',
        );

        c.subscriptionType = nowSub ? 'subscriber' : 'recommended';
        btn.textContent = nowSub ? 'Отписаться' : 'Подписаться';
        this.cachedCommunities = null;
      } catch {
        notifier.show('Ошибка', 'Не удалось выполнить действие', 'error');
      } finally {
        btn.disabled = false;
      }
    });

    right.appendChild(btn);

    row.appendChild(left);
    row.appendChild(right);

    row.addEventListener('click', () => navigateTo(`/community/${c.id}`));
    return row;
  }

  private userRow(id: number, name: string, avatarUrl: string, status: FriendStatus): HTMLElement {
    const row = document.createElement('div');
    row.className = 'search-row';

    const left = document.createElement('div');
    left.className = 'search-row__left';

    const avatar = document.createElement('img');
    avatar.className = 'search-row__avatar';
    avatar.src = avatarUrl;
    avatar.alt = name;

    const text = document.createElement('div');
    text.className = 'search-row__text';

    const title = document.createElement('div');
    title.className = 'search-row__title';
    title.textContent = name;

    const desc = document.createElement('div');
    desc.className = 'search-row__desc';
    desc.textContent =
      status === 'accepted'
        ? 'В друзьях'
        : status === 'pending'
          ? 'Запрос в друзья'
          : status === 'sent'
            ? 'Запрос отправлен'
            : 'Возможный друг';

    text.appendChild(title);
    text.appendChild(desc);

    left.appendChild(avatar);
    left.appendChild(text);

    const right = document.createElement('div');
    right.className = 'search-row__actions';

    const mkBtn = (t: string, variant: 'primary' | 'ghost' = 'primary') => {
      const b = document.createElement('button');
      b.className = `search-row__btn ${variant === 'ghost' ? 'search-row__btn--ghost' : ''}`.trim();
      b.textContent = t;
      return b;
    };

    if (status === 'accepted') {
      const msg = mkBtn('Сообщение');
      msg.addEventListener('click', (e) => {
        e.stopPropagation();
        sessionStorage.setItem('openChatUserId', String(id));
        navigateTo('/messanger');
      });
      right.appendChild(msg);
    } else if (status === 'pending') {
      const accept = mkBtn('Принять');
      accept.addEventListener('click', async (e) => {
        e.stopPropagation();
        accept.disabled = true;
        try {
          await acceptFriend(id);
          notifier.show('Готово', 'Пользователь добавлен в друзья', 'success');
          this.cachedUsers = null;
          await this.loadAndRender();
        } catch {
          notifier.show('Ошибка', 'Не удалось принять заявку', 'error');
        } finally {
          accept.disabled = false;
        }
      });

      const reject = mkBtn('Отклонить', 'ghost');
      reject.addEventListener('click', async (e) => {
        e.stopPropagation();
        reject.disabled = true;
        try {
          await rejectFriendRequest(id);
          notifier.show('Отклонено', 'Заявка отклонена', 'warning');
          this.cachedUsers = null;
          await this.loadAndRender();
        } catch {
          notifier.show('Ошибка', 'Не удалось отклонить заявку', 'error');
        } finally {
          reject.disabled = false;
        }
      });

      right.appendChild(accept);
      right.appendChild(reject);
    } else if (status === 'sent') {
      const cancel = mkBtn('Отменить');
      cancel.addEventListener('click', async (e) => {
        e.stopPropagation();
        cancel.disabled = true;
        try {
          await deleteFriend(id);
          notifier.show('Отменено', 'Заявка отменена', 'warning');
          this.cachedUsers = null;
          await this.loadAndRender();
        } catch {
          notifier.show('Ошибка', 'Не удалось отменить заявку', 'error');
        } finally {
          cancel.disabled = false;
        }
      });
      right.appendChild(cancel);
    } else {
      const add = mkBtn('Добавить');
      add.addEventListener('click', async (e) => {
        e.stopPropagation();
        add.disabled = true;
        try {
          await sendFriendRequest(id);
          notifier.show('Заявка отправлена', 'Пользователь получит уведомление', 'success');
          this.cachedUsers = null;
          await this.loadAndRender();
        } catch {
          notifier.show('Ошибка', 'Не удалось отправить заявку', 'error');
        } finally {
          add.disabled = false;
        }
      });
      right.appendChild(add);
    }

    row.appendChild(left);
    row.appendChild(right);

    row.addEventListener('click', () => navigateTo(`/profile/${id}`));
    return row;
  }

  private emptyRow(text: string): HTMLElement {
    const el = document.createElement('div');
    el.className = 'search-row search-row--empty';
    el.textContent = text;
    return el;
  }
}
