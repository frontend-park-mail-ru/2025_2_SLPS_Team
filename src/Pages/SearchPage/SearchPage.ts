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
} from '../../shared/api/friendsApi';

import {
  getMyCommunities,
  getOtherCommunities,
  searchCommunities,
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

    const type = ('all' as unknown) as FriendsSearchBackendType;

    const [usersFound, communitiesFound] = await Promise.all([
      searchProfiles(this.q, type).catch(() => [] as ProfileDTO[]),
      searchCommunities<CommunityLike>({ name: this.q, type: 'all' }).catch(() => [] as CommunityLike[]),
    ]);

    this.renderUsers(usersFound);
    this.renderCommunities(communitiesFound);
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
      const id = getUserId(u);
      const row = this.makeRow(
        getUserName(u),
        u.avatarPath ?? u.avatar ?? null,
        () => navigateTo(`/profile/${id}`),
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
      const row = this.makeRow(
        getCommunityName(c),
        c.avatar ?? c.avatarPath ?? c.photo ?? null,
        () => navigateTo(`/community/${id}`),
      );
      this.communitiesList.appendChild(row);
    }
  }

  private makeRow(title: string, avatar: string | null, onClick: () => void): HTMLElement {
    const row = document.createElement('div');
    row.className = 'navbar-search-item';

    const left = document.createElement('div');
    left.className = 'navbar-search-item__left';

    const img = document.createElement('img');
    img.className = 'navbar-search-item__avatar';
    img.src = avatar || '/public/globalImages/DefaultAvatar.svg';

    const name = document.createElement('div');
    name.className = 'navbar-search-item__name';
    name.textContent = title;

    left.appendChild(img);
    left.appendChild(name);
    row.appendChild(left);

    row.addEventListener('click', onClick);
    return row;
  }

  private makeEmpty(text: string): HTMLElement {
    const el = document.createElement('div');
    el.textContent = text;
    el.style.opacity = '0.7';
    return el;
  }
}
