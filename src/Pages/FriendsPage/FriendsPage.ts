import BasePage from '../BasePage';
import FriendsPageTemplate from './FriendsPage.hbs';

import { renderFriendsStats } from '../../components/molecules/FriendsStats/FriendsStats';
import { renderFriendsList } from '../../components/organisms/FriendsList/FriendsList';
import { ApplicationModal } from '../../components/organisms/ApplicationModal/ApplicationModal';
import { NotificationManager } from '../../components/organisms/NotificationsBlock/NotificationsManager';

import './FriendsPage.css';

import {
  getFriendRequests,
  getFriends,
  getPossibleFriends,
  searchProfiles,
} from '../../shared/api/friendsApi';

import {
  FriendListItem,
  FriendsData,
  FriendsListType,
  ProfileDTO,
  SEARCH_TYPES_BY_LIST,
} from '../../shared/types/friends';

const notifier = new NotificationManager();

function calculateAge(dobString?: string | null): number | null {
  if (!dobString) return null;

  const dob = new Date(dobString);
  if (Number.isNaN(dob.getTime())) return null;

  const diffMs = Date.now() - dob.getTime();
  const ageDate = new Date(diffMs);
  const age = Math.abs(ageDate.getUTCFullYear() - 1970);

  return Number.isFinite(age) ? age : null;
}

function mapProfileToFriendItem(user: ProfileDTO, type: FriendsListType): FriendListItem {
  return {
    userID: user.userID,
    name: user.fullName,
    avatarPath: user.avatarPath ?? null,
    age: user.dob ? calculateAge(user.dob) : null,
    type,
  };
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


function isFriendsListType(value: string): value is FriendsListType {
  return value === 'friends' || value === 'subscribers' || value === 'possible';
}

export class FriendsPage extends BasePage {
  private currentListType: FriendsListType = 'friends';
  private wrapper: HTMLDivElement | null = null;

  private friendsData: FriendsData = {
    friends: [],
    subscribers: [],
    possible: [],
  };

  private searchQuery = '';
  private currentSearchResults: FriendListItem[] | null = null;

  private pageRoot: HTMLElement | null = null;
  private contentContainer: HTMLElement | null = null;
  private sidebarContainer: HTMLElement | null = null;
  private searchInput: HTMLInputElement | null = null;

  async render(): Promise<void> {
    document.getElementById('page-wrapper')?.remove();

    this.wrapper = document.createElement('div');
    this.wrapper.id = 'page-wrapper';

    const pageElement = document.createElement('div');
    pageElement.innerHTML = FriendsPageTemplate({ title: this.getTitle() });

    const friendsPage = pageElement.firstElementChild;
    if (!(friendsPage instanceof HTMLElement)) {
      throw new Error('[FriendsPage] Template root is not an HTMLElement');
    }

    this.pageRoot = friendsPage;

    const content = friendsPage.querySelector('.friends-page__content');
    const sidebar = friendsPage.querySelector('.friends-page__sidebar');

    if (!(content instanceof HTMLElement) || !(sidebar instanceof HTMLElement)) {
      throw new Error('[FriendsPage] Missing required containers in template');
    }

    this.contentContainer = content;
    this.sidebarContainer = sidebar;

    await this.loadFriendsData();

    this.renderSidebar();
    this.renderList();

    this.wrapper.appendChild(friendsPage);
    this.rootElement.appendChild(this.wrapper);

    this.setupSearch();

  }

  private getTitle(): string {
    switch (this.currentListType) {
      case 'subscribers':
        return 'Подписчики';
      case 'possible':
        return 'Возможные друзья';
      case 'friends':
      default:
        return 'Ваши друзья';
    }
  }

  private async loadFriendsData(): Promise<void> {
    const [requestsRaw, friendsRaw, possibleRaw] = await Promise.all([
      getFriendRequests() as Promise<ProfileDTO[]>,
      getFriends() as Promise<ProfileDTO[]>,
      getPossibleFriends() as Promise<ProfileDTO[] | null | undefined>,
    ]);

    const subscribers = requestsRaw.map((u) => mapProfileToFriendItem(u, 'subscribers'));
    const friends = friendsRaw.map((u) => mapProfileToFriendItem(u, 'friends'));
    const possible = (possibleRaw ?? []).map((u) => mapProfileToFriendItem(u, 'possible'));

    this.friendsData = { friends, subscribers, possible };
  }

  private getCurrentData(): FriendListItem[] {
    const baseData = this.friendsData[this.currentListType];
    return this.currentSearchResults ?? baseData;
  }

  private renderSidebar(): void {
    if (!this.sidebarContainer) return;

    this.sidebarContainer.querySelector('.friends-stats')?.remove();

    const statsNode = renderFriendsStats({
      friendsCount: this.friendsData.friends.length,
      subscribersCount: this.friendsData.subscribers.length,
      possibleCount: this.friendsData.possible.length,
      currentType: this.currentListType,
    });

    this.sidebarContainer.appendChild(statsNode);
    this.bindStatsEvents();
  }

  private renderList(): void {
    if (!this.contentContainer) return;

    this.contentContainer.querySelector('.friends-list')?.remove();

    const listNode = renderFriendsList({
      friends: this.getCurrentData(),
      listType: this.currentListType,
    });

    this.contentContainer.appendChild(listNode);
    this.changeHeader();
  }

  private bindStatsEvents(): void {
    if (!this.sidebarContainer) return;

    const buttons = this.sidebarContainer.querySelectorAll<HTMLElement>('.friends-stats__item');

    buttons.forEach((button) => {
      button.onclick = (e) => {
        const target = e.currentTarget;
        if (!(target instanceof HTMLElement)) return;

        const raw = target.dataset.type;
        if (!raw || !isFriendsListType(raw)) return;

        if (raw === this.currentListType) return;

        this.currentListType = raw;
        this.resetSearchState();
        this.renderSidebar();
        this.renderList();
      };
    });
  }

  private changeHeader(): void {
    const header = this.wrapper?.querySelector('.friends-page__title');
    if (header instanceof HTMLElement) {
      header.textContent = this.getTitle();
    }
  }

  private resetSearchState(): void {
    this.searchQuery = '';
    this.currentSearchResults = null;

    if (this.searchInput) {
      this.searchInput.value = '';
    } else {
      const input = this.wrapper?.querySelector('.search-input');
      if (input instanceof HTMLInputElement) input.value = '';
    }
  }

  private setupSearch(): void {
    if (!this.pageRoot) return;

    const input = this.pageRoot.querySelector('.search-input');
    if (!(input instanceof HTMLInputElement)) return;

    this.searchInput = input;

    const onSearch = debounce(() => {
      void this.handleSearchChange();
    }, 300);

    input.addEventListener('input', () => {
      this.searchQuery = input.value.trim();
      onSearch();
    });
  }

  private async handleSearchChange(): Promise<void> {
    const query = this.searchQuery;

    if (!query) {
      this.currentSearchResults = null;
      this.renderSidebar();
      this.renderList();
      return;
    }

    const backendType = SEARCH_TYPES_BY_LIST[this.currentListType];

    try {
      const result = (await searchProfiles(query, backendType)) as ProfileDTO[] | null | undefined;

      this.currentSearchResults = (result ?? []).map((u) =>
        mapProfileToFriendItem(u, this.currentListType),
      );

      this.renderSidebar();
      this.renderList();
    } catch (err) {
      console.error('[FriendsPage] searchProfiles error:', err);

      this.currentSearchResults = null;
      this.renderSidebar();
      this.renderList();
    }
  }

}
