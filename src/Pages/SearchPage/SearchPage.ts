import BasePage from '../BasePage';
import Template from './SearchPage.hbs';
import './SearchPage.css';

import { navigateTo } from '../../index';

import {
  getFriends,
  getPossibleFriends,
  searchProfiles,
} from '../../shared/api/friendsApi';

import {
  getMyCommunities,
  getOtherCommunities,
  searchCommunities,
  UPLOADS_BASE,
} from '../../shared/api/communityApi';

import type { ProfileDTO, FriendsSearchBackendType } from '../../shared/types/friends';

type Mode = 'overview' | 'users' | 'communities';

type CommunityLike = {
  id?: number;
  communityID?: number;
  name?: string;
  groupName?: string;
  avatar?: string | null;
  avatarPath?: string | null;
  photo?: string | null;
};

function uniqById<T extends { id: number }>(arr: T[]): T[] {
  const seen = new Set<number>();
  const out: T[] = [];
  for (const x of arr) {
    if (seen.has(x.id)) continue;
    seen.add(x.id);
    out.push(x);
  }
  return out;
}

function getIdFromCommunity(c: CommunityLike): number {
  if (typeof c.id === 'number') return c.id;
  if (typeof c.communityID === 'number') return c.communityID;
  return 0;
}

function getNameFromCommunity(c: CommunityLike): string {
  return (c.name ?? c.groupName ?? '').trim();
}

function normalizeUploadsPath(p?: string | null): string | null {
  const s = (p ?? '').trim();
  if (!s || s === 'null') return null;
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  if (s.startsWith('/')) return s;
  return `${UPLOADS_BASE}${s}`;
}

function debounce<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  delayMs: number,
): (...args: TArgs) => void {
  let timer: number | null = null;

  return (...args: TArgs) => {
    if (timer !== null) window.clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), delayMs);
  };
}

export default class SearchPage extends BasePage {
  private wrapper: HTMLDivElement | null = null;
  private pageRoot: HTMLElement | null = null;

  private input: HTMLInputElement | null = null;

  private tabUsers: HTMLButtonElement | null = null;
  private tabCommunities: HTMLButtonElement | null = null;

  private sectionUsers: HTMLElement | null = null;
  private sectionCommunities: HTMLElement | null = null;

  private usersList: HTMLElement | null = null;
  private communitiesList: HTMLElement | null = null;

  private mode: Mode = 'overview';

  private searchQuery = '';

  private allUsersCache: ProfileDTO[] | null = null;
  private allCommunitiesCache: CommunityLike[] | null = null;

  async render(): Promise<void> {
    document.getElementById('page-wrapper')?.remove();

    this.wrapper = document.createElement('div');
    this.wrapper.id = 'page-wrapper';

    const tmp = document.createElement('div');
    tmp.innerHTML = Template({});

    const root = tmp.firstElementChild;
    if (!(root instanceof HTMLElement)) {
      throw new Error('[SearchPage] Template root is not an HTMLElement');
    }

    this.pageRoot = root;

    this.input = root.querySelector('.search-page__input-field');
    this.tabUsers = root.querySelector('.search-page__tab--users');
    this.tabCommunities = root.querySelector('.search-page__tab--communities');

    this.sectionUsers = root.querySelector('.search-page__section--users');
    this.sectionCommunities = root.querySelector('.search-page__section--communities');

    this.usersList = root.querySelector('.search-page__list--users');
    this.communitiesList = root.querySelector('.search-page__list--communities');

    if (!(this.input instanceof HTMLInputElement)) throw new Error('[SearchPage] input not found');
    if (!(this.usersList instanceof HTMLElement)) throw new Error('[SearchPage] users list not found');
    if (!(this.communitiesList instanceof HTMLElement)) throw new Error('[SearchPage] communities list not found');
    if (!(this.sectionUsers instanceof HTMLElement)) throw new Error('[SearchPage] users section not found');
    if (!(this.sectionCommunities instanceof HTMLElement)) throw new Error('[SearchPage] communities section not found');

    const qFromUrl = new URLSearchParams(window.location.search).get('q') ?? '';
    const qFromStorage = sessionStorage.getItem('globalSearchQuery') ?? '';
    this.searchQuery = (qFromUrl || qFromStorage).trim();

    this.input.value = this.searchQuery;

    this.tabUsers?.addEventListener('click', () => this.setMode('users'));
    this.tabCommunities?.addEventListener('click', () => this.setMode('communities'));

    const onInputDebounced = debounce(() => {
      void this.applySearch();
    }, 300);

    this.input.addEventListener('input', () => {
      this.searchQuery = this.input?.value.trim() ?? '';
      sessionStorage.setItem('globalSearchQuery', this.searchQuery);

      const url = this.searchQuery
        ? `/search?q=${encodeURIComponent(this.searchQuery)}`
        : '/search';

      window.history.replaceState({}, '', url);

      onInputDebounced();
    });

    this.setMode('overview');

    await this.applySearch();

    this.wrapper.appendChild(root);
    this.rootElement.appendChild(this.wrapper);
  }

  private setMode(mode: Mode): void {
    this.mode = mode;

    this.tabUsers?.classList.toggle('search-page__tab--active', mode === 'users');
    this.tabCommunities?.classList.toggle('search-page__tab--active', mode === 'communities');

    if (!this.sectionUsers || !this.sectionCommunities) return;

    if (mode === 'overview') {
      this.sectionUsers.style.display = '';
      this.sectionCommunities.style.display = '';
      return;
    }

    if (mode === 'users') {
      this.sectionUsers.style.display = '';
      this.sectionCommunities.style.display = 'none';
      return;
    }

    this.sectionUsers.style.display = 'none';
    this.sectionCommunities.style.display = '';
  }

  private clearLists(): void {
    if (this.usersList) this.usersList.innerHTML = '';
    if (this.communitiesList) this.communitiesList.innerHTML = '';
  }

  private async applySearch(): Promise<void> {
    this.clearLists();

    const q = this.searchQuery.trim();

    if (!q) {
      await this.ensureAllCaches();

      const users = this.allUsersCache ?? [];
      const communities = this.allCommunitiesCache ?? [];

      if (this.mode === 'overview' || this.mode === 'users') {
        this.renderUsers(users);
      }
      if (this.mode === 'overview' || this.mode === 'communities') {
        this.renderCommunities(communities);
      }

      return;
    }

    const backendUsersType = ('all' as unknown) as FriendsSearchBackendType;

    const [usersFound, communitiesFound] = await Promise.all([
      (this.mode === 'overview' || this.mode === 'users')
        ? this.safeSearchUsers(q, backendUsersType)
        : Promise.resolve([] as ProfileDTO[]),

      (this.mode === 'overview' || this.mode === 'communities')
        ? this.safeSearchCommunities(q)
        : Promise.resolve([] as CommunityLike[]),
    ]);

    if (this.mode === 'overview' || this.mode === 'users') {
      this.renderUsers(usersFound);
    }
    if (this.mode === 'overview' || this.mode === 'communities') {
      this.renderCommunities(communitiesFound);
    }
  }

  private async ensureAllCaches(): Promise<void> {
    if (this.allUsersCache && this.allCommunitiesCache) return;

    const [possible, friends, otherComm, myComm] = await Promise.all([
      getPossibleFriends().catch(() => [] as ProfileDTO[]),
      getFriends().catch(() => [] as ProfileDTO[]),
      getOtherCommunities<CommunityLike>().catch(() => [] as CommunityLike[]),
      getMyCommunities<CommunityLike>().catch(() => [] as CommunityLike[]),
    ]);

    const usersMerged = [...(possible ?? []), ...(friends ?? [])];
    const usersUniq: ProfileDTO[] = (() => {
      const seen = new Set<number>();
      const out: ProfileDTO[] = [];
      for (const u of usersMerged) {
        const id = (u as any).userID ?? (u as any).id;
        if (typeof id !== 'number') continue;
        if (seen.has(id)) continue;
        seen.add(id);
        out.push(u);
      }
      return out;
    })();

    const commMerged = [...(otherComm ?? []), ...(myComm ?? [])];
    const commUniq = uniqById(
      commMerged
        .map((c) => ({ ...c, id: getIdFromCommunity(c) }))
        .filter((c) => typeof c.id === 'number' && c.id > 0) as Array<CommunityLike & { id: number }>,
    );

    this.allUsersCache = usersUniq;
    this.allCommunitiesCache = commUniq;
  }

  private async safeSearchUsers(
    q: string,
    type: FriendsSearchBackendType,
  ): Promise<ProfileDTO[]> {
    try {
      const data = await searchProfiles(q, type);
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.error('[SearchPage] searchProfiles error:', e);
      return [];
    }
  }

  private async safeSearchCommunities(q: string): Promise<CommunityLike[]> {
    try {
      const data = await searchCommunities<CommunityLike>({
        name: q,
        type: 'all',
      });
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.error('[SearchPage] searchCommunities error:', e);
      return [];
    }
  }

  private renderUsers(users: ProfileDTO[]): void {
    if (!this.usersList) return;

    if (!users.length) {
      this.usersList.appendChild(this.makeEmpty('Ничего не найдено'));
      return;
    }

    for (const u of users) {
      const id = (u as any).userID ?? (u as any).id;
      const name = (u as any).fullName ?? (u as any).full_name ?? 'Пользователь';
      const avatarPath = (u as any).avatarPath ?? (u as any).avatar ?? null;

      const card = document.createElement('div');
      card.className = 'search-result search-result--user';
      card.style.display = 'flex';
      card.style.alignItems = 'center';
      card.style.gap = '10px';
      card.style.cursor = 'pointer';

      const img = document.createElement('img');
      img.width = 36;
      img.height = 36;
      img.style.borderRadius = '50%';
      img.src = normalizeUploadsPath(avatarPath) ?? '/public/globalImages/DefaultAvatar.svg';

      const title = document.createElement('div');
      title.textContent = String(name);

      card.appendChild(img);
      card.appendChild(title);

      if (typeof id === 'number') {
        card.addEventListener('click', () => navigateTo(`/profile/${id}`));
      }

      this.usersList.appendChild(card);
    }
  }

  private renderCommunities(communities: CommunityLike[]): void {
    if (!this.communitiesList) return;

    if (!communities.length) {
      this.communitiesList.appendChild(this.makeEmpty('Ничего не найдено'));
      return;
    }

    for (const c of communities) {
      const id = getIdFromCommunity(c);
      const name = getNameFromCommunity(c) || 'Сообщество';
      const avatar =
        normalizeUploadsPath(c.avatar ?? c.avatarPath ?? c.photo ?? null);

      const card = document.createElement('div');
      card.className = 'search-result search-result--community';
      card.style.display = 'flex';
      card.style.alignItems = 'center';
      card.style.gap = '10px';
      card.style.cursor = 'pointer';

      const img = document.createElement('img');
      img.width = 36;
      img.height = 36;
      img.style.borderRadius = '10px';
      img.src = avatar ?? '/public/globalImages/DefaultAvatar.svg';

      const title = document.createElement('div');
      title.textContent = name;

      card.appendChild(img);
      card.appendChild(title);

      if (id > 0) {
        card.addEventListener('click', () => navigateTo(`/community/${id}`));
      }

      this.communitiesList.appendChild(card);
    }
  }

  private makeEmpty(text: string): HTMLElement {
    const el = document.createElement('div');
    el.className = 'search-page__empty';
    el.textContent = text;
    el.style.opacity = '0.7';
    return el;
  }
}
