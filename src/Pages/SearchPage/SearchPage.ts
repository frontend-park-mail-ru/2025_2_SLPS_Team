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

function toAbsUploadsUrl(path: string | null | undefined): string {
  if (!path || path === 'null') return '/public/globalImages/DefaultAvatar.svg';
  const s = String(path).trim();
  if (!s) return '/public/globalImages/DefaultAvatar.svg';
  if (s.startsWith('http://') || s.startsWith('https://')) return s;

  const base = (process.env.API_BASE_URL ?? '').replace(/\/$/, '');
  if (!base) return s.startsWith('/') ? s : `/${s}`;
  if (s.startsWith('/')) return `${base}${s}`;
  return `${base}/${s}`;
}

function getUserStatus(u: any): string {
  return (u?.status ?? u?.type ?? u?.friendStatus ?? 'notFriends') as string;
}

function isCommunitySubscribed(c: any): boolean {
  return c?.isSubscribed === true || c?.subscriptionType === 'subscriber';
}

export default class SearchPage extends BasePage {
  private wrapper!: HTMLDivElement;
  private root!: HTMLElement;

  private input!: HTMLInputElement;
  private usersList!: HTMLElement;
  private communitiesList!: HTMLElement;
  private statsRoot!: HTMLElement;

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

    this.usersList.style.display = tab === 'all' || tab === 'users' ? '' : 'none';
    this.communitiesList.style.display = tab === 'all' || tab === 'communities' ? '' : 'none';

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
      const [users, communities] = await Promise.all([
        this.ensureAllUsers(),
        this.ensureAllCommunities(),
      ]);

      this.renderUsers(users);
      this.renderCommunities(communities);
      return;
    }

    const [usersFound, communitiesFound] = await Promise.all([
      this.searchUsersAllTypes(this.q).catch(() => [] as ProfileDTO[]),
      this.searchCommunitiesSafe(this.q).catch(() => [] as CommunityLike[]),
    ]);

    this.renderUsers(usersFound);
    this.renderCommunities(communitiesFound);
  }

  private async searchUsersAllTypes(q: string): Promise<ProfileDTO[]> {
    const types: FriendsSearchBackendType[] = [
      'accepted',
      'pending',
      'sent',
      'notFriends',
    ] as unknown as FriendsSearchBackendType[];

    const responses = await Promise.all(
      types.map((t) => searchProfiles(q, t, 1, 20).catch(() => [] as ProfileDTO[])),
    );

    const merged = responses.flat();
    return uniqById(merged, getUserId);
  }

  private async searchCommunitiesSafe(q: string): Promise<CommunityLike[]> {
    try {
      const data = await searchCommunities<CommunityLike>({ name: q, page: 1, limit: 20 });
      if (Array.isArray(data)) return uniqById(data, getCommunityId);
      return [];
    } catch {
      const [sub, rec] = await Promise.all([
        searchCommunities<CommunityLike>({ name: q, type: 'subscriber', page: 1, limit: 20 }).catch(
          () => [] as CommunityLike[],
        ),
        searchCommunities<CommunityLike>({ name: q, type: 'recommended', page: 1, limit: 20 }).catch(
          () => [] as CommunityLike[],
        ),
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

  private renderUsers(items: ProfileDTO[]): void {
    if (this.tab === 'communities') return;

    if (!items.length) {
      this.usersList.appendChild(this.makeEmpty('Пользователи не найдены'));
      return;
    }

    for (const u of items as any[]) {
      this.usersList.appendChild(this.makeUserRow(u));
    }
  }

  private renderCommunities(items: CommunityLike[]): void {
    if (this.tab === 'users') return;

    if (!items.length) {
      this.communitiesList.appendChild(this.makeEmpty('Сообщества не найдены'));
      return;
    }

    for (const c of items as any[]) {
      this.communitiesList.appendChild(this.makeCommunityRow(c));
    }
  }

  private makeUserRow(u: any): HTMLElement {
    const id = getUserId(u);
    const title = getUserName(u);
    const status = getUserStatus(u);

    const row = document.createElement('div');
    row.className = 'search-result-item';

    const left = document.createElement('div');
    left.className = 'search-result-item__left';

    const img = document.createElement('img');
    img.className = 'search-result-item__avatar';
    img.src = toAbsUploadsUrl(u.avatarPath ?? u.avatar ?? null);
    img.alt = title;

    const meta = document.createElement('div');
    meta.className = 'search-result-item__meta';

    const name = document.createElement('div');
    name.className = 'search-result-item__name';
    name.textContent = title;

    const sub = document.createElement('div');
    sub.className = 'search-result-item__sub';
    sub.textContent =
      status === 'accepted'
        ? 'У вас в друзьях'
        : status === 'pending' || status === 'sent'
          ? 'Заявка отправлена'
          : 'Не в друзьях';

    meta.appendChild(name);
    meta.appendChild(sub);

    left.appendChild(img);
    left.appendChild(meta);

    const btn = document.createElement('button');
    btn.className = 'search-result-item__btn';

    if (status === 'accepted') {
      btn.textContent = 'В друзьях';
      btn.classList.add('search-result-item__btn--muted');
    } else if (status === 'pending' || status === 'sent') {
      btn.textContent = 'Заявка отправлена';
      btn.classList.add('search-result-item__btn--muted');
    } else {
      btn.textContent = 'Добавить';
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!id) return;
        btn.disabled = true;
        try {
          await sendFriendRequest(id);
          btn.textContent = 'Заявка отправлена';
          btn.classList.add('search-result-item__btn--muted');
          sub.textContent = 'Заявка отправлена';
        } catch (err) {
          console.error('[SearchPage] sendFriendRequest error', err);
          btn.disabled = false;
        }
      });
    }

    row.addEventListener('click', () => navigateTo(`/profile/${id}`));
    row.appendChild(left);
    row.appendChild(btn);
    return row;
  }

  private makeCommunityRow(c: any): HTMLElement {
    const id = getCommunityId(c);
    const title = getCommunityName(c);

    let subscribed = isCommunitySubscribed(c);

    const row = document.createElement('div');
    row.className = 'search-result-item';

    const left = document.createElement('div');
    left.className = 'search-result-item__left';

    const img = document.createElement('img');
    img.className = 'search-result-item__avatar';
    img.src = toAbsUploadsUrl(c.avatar ?? c.avatarPath ?? c.photo ?? null);
    img.alt = title;

    const meta = document.createElement('div');
    meta.className = 'search-result-item__meta';

    const name = document.createElement('div');
    name.className = 'search-result-item__name';
    name.textContent = title;

    const sub = document.createElement('div');
    sub.className = 'search-result-item__sub';
    sub.textContent = subscribed ? 'Вы подписаны' : 'Рекомендуемое';

    meta.appendChild(name);
    meta.appendChild(sub);

    left.appendChild(img);
    left.appendChild(meta);

    const btn = document.createElement('button');
    btn.className = 'search-result-item__btn';
    btn.textContent = subscribed ? 'Отписаться' : 'Подписаться';

    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!id) return;
      btn.disabled = true;
      try {
        const res = await toggleCommunitySubscription(id, subscribed);
        const now = res.isSubscribed;
        subscribed = now;
        btn.textContent = now ? 'Отписаться' : 'Подписаться';
        sub.textContent = now ? 'Вы подписаны' : 'Рекомендуемое';
        // локально обновим объект (на случай повторного рендера из кэша)
        c.subscriptionType = now ? 'subscriber' : 'recommended';
        c.isSubscribed = now;
      } catch (err) {
        console.error('[SearchPage] toggleCommunitySubscription error', err);
      } finally {
        btn.disabled = false;
      }
    });

    row.addEventListener('click', () => navigateTo(`/community/${id}`));
    row.appendChild(left);
    row.appendChild(btn);
    return row;
  }

  private makeEmpty(text: string): HTMLElement {
    const el = document.createElement('div');
    el.textContent = text;
    el.className = 'search-result-empty';
    return el;
  }
}
