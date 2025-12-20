import BasePage from '../BasePage';
import FriendsPageTemplate from './FriendsPage.hbs';

import { renderFriendsStats } from '../../components/molecules/FriendsStats/FriendsStats';
import { renderFriendsList } from '../../components/organisms/FriendsList/FriendsList';
import { NotificationManager } from '../../components/organisms/NotificationsBlock/NotificationsManager';

import './FriendsPage.css';

import {
  getFriendRequests,
  getFriends,
  getPossibleFriends,
  rejectFriendRequest ,
  searchProfiles,
} from '../../shared/api/friendsApi';

import type {
  FriendListItem,
  FriendsData,
  FriendsListType,
  ProfileDTO,
} from '../../shared/types/friends';

import { SEARCH_TYPES_BY_LIST } from '../../shared/types/friends';

const notifier = new NotificationManager();

type ExtendedFriendsListType = FriendsListType | 'sent';

function calculateAge(dobString?: string | null): number | null {
  if (!dobString) return null;

  const dob = new Date(dobString);
  if (Number.isNaN(dob.getTime())) return null;

  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();

  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) age -= 1;

  return age;
}

function mapProfileToFriendItem(user: ProfileDTO, type: ExtendedFriendsListType): FriendListItem {
  return {
    userID: user.userID,
    name: user.fullName,
    avatarPath: user.avatarPath ?? null,
    age: user.dob ? calculateAge(user.dob) : null,
    type: type as any,
  } as FriendListItem;
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

function isExtendedFriendsListType(value: string): value is ExtendedFriendsListType {
  return value === 'friends' || value === 'subscribers' || value === 'possible' || value === 'sent';
}

export class FriendsPage extends BasePage {
  private currentListType: ExtendedFriendsListType = 'friends';
  private wrapper: HTMLDivElement | null = null;

  friendsData: FriendsData = {
    friends: [],
    subscribers: [],
    possible: [],
    sent: [],
  }



  private searchQuery = '';
  private currentSearchResults: FriendListItem[] | null = null;

  private pageRoot: HTMLElement | null = null;
  private contentContainer: HTMLElement | null = null;
  private sidebarContainer: HTMLElement | null = null;
  private searchInput: HTMLInputElement | null = null;

  async render(): Promise<void> {
    this.wrapper = document.createElement('div');

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = FriendsPageTemplate({ title: this.getTitle() });

    const friendsPage = tempDiv.firstElementChild as HTMLElement | null;
    if (!friendsPage) throw new Error('[FriendsPage] template root not found');

    this.pageRoot = friendsPage;

    const content = friendsPage.querySelector('.friends-page__content');
    const sidebar = friendsPage.querySelector('.friends-page__sidebar');

    if (!(content instanceof HTMLElement) || !(sidebar instanceof HTMLElement)) {
      throw new Error('[FriendsPage] content/sidebar not found');
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
      case 'sent':
        return 'Отправленные запросы';
      case 'friends':
      default:
        return 'Ваши друзья';
    }
  }

  private async loadFriendsData(): Promise<void> {
    const [requestsRaw, friendsRaw, possibleRaw, sentRaw] = await Promise.all([
      getFriendRequests() as Promise<ProfileDTO[]>,
      getFriends() as Promise<ProfileDTO[]>,
      getPossibleFriends() as Promise<ProfileDTO[] | null | undefined>,
      searchProfiles('+', 'sent' as any, 1, 50) as Promise<ProfileDTO[]>,
    ]);

    console.log('[FriendsPage] sentRaw:', sentRaw);

    const subscribers = (requestsRaw ?? []).map((u) =>
      mapProfileToFriendItem(u, 'subscribers'),
    );
    const friends = (friendsRaw ?? []).map((u) =>
      mapProfileToFriendItem(u, 'friends'),
    );
    const possible = (possibleRaw ?? []).map((u) =>
      mapProfileToFriendItem(u, 'possible'),
    );
    const sent = (sentRaw ?? []).map((u) =>
      mapProfileToFriendItem(u, 'sent'),
    );

    this.friendsData = {
      friends,
      subscribers,
      possible,
      sent,
    };
  }


  private getCurrentData(): FriendListItem[] {
      return this.currentSearchResults ?? this.friendsData[this.currentListType];
  }

  private renderSidebar(): void {
    if (!this.sidebarContainer) return;

    this.sidebarContainer.querySelector('.friends-stats')?.remove();

    const statsNode = renderFriendsStats({
      friendsCount: this.friendsData.friends.length,
      subscribersCount: this.friendsData.subscribers.length,
      possibleCount: this.friendsData.possible.length,
      currentType: this.currentListType as any,
    });

    this.sidebarContainer.appendChild(statsNode);

    const itemsRoot =
      statsNode.querySelector('.friends-stats__list') ??
      statsNode.querySelector('.friends-stats') ??
      statsNode;

    const sentItem = document.createElement('div');
    sentItem.className = 'friends-stats__item';
    sentItem.dataset.type = 'sent';
    sentItem.textContent = `Отправленные (${this.friendsData.sent.length})`;


    itemsRoot.appendChild(sentItem);

    this.bindStatsEvents();
  }

  private renderList(): void {
    if (!this.contentContainer) return;

    this.contentContainer.querySelector('.friends-list')?.remove();

    const listNode = renderFriendsList({
      friends: this.getCurrentData(),
      listType: this.currentListType as any,
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
        if (!raw || !isExtendedFriendsListType(raw)) return;

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
    if (header instanceof HTMLElement) header.textContent = this.getTitle();
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
      notifier.show('Ошибка', 'Не удалось выполнить поиск', 'error');

      this.currentSearchResults = null;
      this.renderSidebar();
      this.renderList();
    }
  }
}
