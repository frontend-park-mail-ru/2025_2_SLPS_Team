import BasePage from '../BasePage';
import Template from './SearchPage.hbs';
import './SearchPage.css';

import SearchStatsTemplate from './SearchStats.hbs';
import '../../components/molecules/FriendsStats/FriendsStats.css'; 

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

type Tab = 'users' | 'communities';

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
    if (t != null) window.clearTimeout(t);
    t = window.setTimeout(fn, ms);
  };
}

function uniqByKey<T>(items: T[], keyFn: (x: T) => number): T[] {
  const seen = new Set<number>();
  const out: T[] = [];
  for (const x of items) {
    const k = keyFn(x);
    if (!k) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out;
}

function getUserId(u: any): number {
  return typeof u?.userID === 'number' ? u.userID : (typeof u?.id === 'number' ? u.id : 0);
}

function getUserName(u: any): string {
  return (u?.fullName ?? u?.full_name ?? u?.login ?? '').toString() || 'Пользователь';
}

function getCommunityId(c: any): number {
  return typeof c?.id === 'number' ? c.id : (typeof c?.communityID === 'number' ? c.communityID : 0);
}

function getCommunityName(c: any): string {
  return (c?.name ?? c?.groupName ?? '').toString() || 'Сообщество';
}

export default class SearchPage extends BasePage {
  private wrapper!: HTMLDivElement;
  private root!: HTMLElement;

  private input!: HTMLInputElement;

  private statsRoot!: HTMLElement;
  private usersBtn!: HTMLButtonElement;
  private communitiesBtn!: HTMLButtonElement;

  private usersList!: HTMLElement;
  private communitiesList!: HTMLElement;

  private tab: Tab = 'users';
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

    this.renderStats(0, 0);

    this.usersBtn.addEventListener('click', () => this.setTab('users'));
    this.communitiesBtn.addEventListener('click', () => this.setTab('communities'));

    const onInput = debounce(() => {
      this.q = (this.input.value ?? '').trim();
      sessionStorage.setItem('globalSearchQuery', this.q);
      const url = this.q ? `/search?q=${encodeURIComponent(this.q)}` : '/search';
      window.history.replaceState({}, '', url);
      void this.loadAndRender();
    }, 300);

    this.input.addEventListener('input', onInput);

    this.setTab('users');
    await this.loadAndRender();
  }

  private setTab(tab: Tab): void {
    this.tab = tab;

    this.usersBtn.classList.toggle('friends-stats__item--active', tab === 'users');
    this.communitiesBtn.classList.toggle('friends-stats__item--active', tab === 'communities');

    this.usersList.style.display = tab === 'users' ? '' : 'none';
    this.communitiesList.style.display = tab === 'communities' ? '' : 'none';
  }

  private renderStats(usersCount: number, communitiesCount: number): void {
    this.statsRoot.innerHTML = SearchStatsTemplate({
      usersCount,
      communitiesCount,
    });

    const btns = Array.from(this.statsRoot.querySelectorAll('.friends-stats__item')) as HTMLButtonElement[];
    this.usersBtn = btns.find((b) => b.dataset.type === 'users')!;
    this.communitiesBtn = btns.find((b) => b.dataset.type === 'communities')!;
  }

  private clearLists(): void {
    this.usersList.innerHTML = '';
    this.communitiesList.innerHTML = '';
  }

  private async loadAndRender(): Promise<void> {
    this.clearLists();

    const q = this.q;

    if (!q) {
      const [users, communities] = await Promise.all([
        this.ensureAllUsers(),
        this.ensureAllCommunities(),
      ]);

      this.renderStats(users.length, communities.length);

      this.renderUsers(users);
      this.renderCommunities(communities);
      return;
    }

    const backendUsersType = ('all' as unknown) as FriendsSearchBackendType;

    const [usersFound, communitiesFound] = await Promise.all([
      searchProfiles(q, backendUsersType).catch(() => [] as ProfileDTO[]),
      searchCommunities<CommunityLike>({ name: q, type: 'all' }).catch(() => [] as CommunityLike[]),
    ]);

    this.renderStats(usersFound.length, communitiesFound.length);
    this.renderUsers(usersFound);
    this.renderCommunities(communitiesFound);
  }

  private async ensureAllUsers(): Promise<ProfileDTO[]> {
    if (this.allUsers) return this.allUsers;

    const [possible, friends] = await Promise.all([
      getPossibleFriends().catch(() => [] as ProfileDTO[]),
      getFriends().catch(() => [] as ProfileDTO[]),
    ]);

    const merged = [...(possible ?? []), ...(friends ?? [])];
    this.allUsers = uniqByKey(merged, (u: any) => getUserId(u));
    return this.allUsers;
  }

  private async ensureAllCommunities(): Promise<CommunityLike[]> {
    if (this.allCommunities) return this.allCommunities;

    const [other, mine] = await Promise.all([
      getOtherCommunities<CommunityLike>().catch(() => [] as CommunityLike[]),
      getMyCommunities<CommunityLike>().catch(() => [] as CommunityLike[]),
    ]);

    const merged = [...(other ?? []), ...(mine ?? [])];
    this.allCommunities = uniqByKey(merged, (c: any) => getCommunityId(c)) as CommunityLike[];
    return this.allCommunities;
  }

  private renderUsers(items: ProfileDTO[]): void {
    if (!items.length) {
      this.usersList.appendChild(this.makeEmpty('Пользователи не найдены'));
      return;
    }

    for (const u of items as any[]) {
      const id = getUserId(u);
      const name = getUserName(u);

      const row = document.createElement('div');
      row.className = 'friends-list__grid-item'; 
      row.textContent = name;
      row.style.cursor = 'pointer';

      row.addEventListener('click', () => navigateTo(`/profile/${id}`));
      this.usersList.appendChild(row);
    }
  }

  private renderCommunities(items: CommunityLike[]): void {
    if (!items.length) {
      this.communitiesList.appendChild(this.makeEmpty('Сообщества не найдены'));
      return;
    }

    for (const c of items as any[]) {
      const id = getCommunityId(c);
      const name = getCommunityName(c);

      const row = document.createElement('div');
      row.className = 'friends-list__grid-item';
      row.textContent = name;
      row.style.cursor = 'pointer';

      row.addEventListener('click', () => navigateTo(`/community/${id}`));
      this.communitiesList.appendChild(row);
    }
  }

  private makeEmpty(text: string): HTMLElement {
    const el = document.createElement('div');
    el.textContent = text;
    el.style.opacity = '0.7';
    return el;
  }
}
