import BasePage from '../BasePage.js';
import FriendsPageTemplate from './FriendsPage.hbs';
import { renderFriendsStats } from '../../components/molecules/FriendsStats/FriendsStats.js';
import { renderFriendsList } from '../../components/organisms/FriendsList/FriendsList.js';
import { ApplicationModal } from '../../components/organisms/ApplicationModal/ApplicationModal.js';

import './FriendsPage.css';

import { getFriendRequests, getFriends, getPossibleFriends } from '../../shared/api/friendsApi.js';

function calculateAge(dobString) {
  if (!dobString) return null;
  const dob = new Date(dobString);
  const diffMs = Date.now() - dob.getTime();
  const ageDate = new Date(diffMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

export class FriendsPage extends BasePage {
  constructor(rootElement) {
    super(rootElement);
    this.currentListType = 'friends';
    this.wrapper = null;
    this.friendsData = {
      friends: [],
      subscribers: [],
      possible: []
    };
  }

  async render() {
    const existingWrapper = document.getElementById('page-wrapper');
    if (existingWrapper) existingWrapper.remove();

    this.wrapper = document.createElement('div');
    this.wrapper.id = 'page-wrapper';

    const pageElement = document.createElement('div');
    pageElement.innerHTML = FriendsPageTemplate({ title: this.getTitle() });
    const friendsPage = pageElement.firstElementChild;

    const contentContainer = friendsPage.querySelector('.friends-page__content');
    const sidebarContainer = friendsPage.querySelector('.friends-page__sidebar');

    await this.loadFriendsData();

    const friendsStats = renderFriendsStats({
      friendsCount: this.friendsData.friends.length,
      subscribersCount: this.friendsData.subscribers.length,
      possibleCount: this.friendsData.possible.length,
      currentType: this.currentListType,
    });
    sidebarContainer.appendChild(friendsStats);

    this.addStatsEventListeners(sidebarContainer, contentContainer);

    const currentList = this.renderCurrentList();
    if (contentContainer && currentList) contentContainer.appendChild(currentList);

    this.wrapper.appendChild(friendsPage);
    this.rootElement.appendChild(this.wrapper);

    const supportButton = this.wrapper.querySelector('.friends-support-button');
    if (supportButton) {
        const modal = new ApplicationModal(document.body, {
            id: 12,
            first_name: "Иван",
            last_name: "Петров",
            email: "test@example.com",
            topic: "Не работает чат",
            description: "Сообщения не отправляются",
            status: "processing",
            images: [
                "/public/testData/1.jpg",
                "/public/testData/1.jpg"
            ]
        });
        supportButton.addEventListener('click', () => modal.open());
    }
  }

  getTitle() {
    if (this.currentListType === 'subscribers') return 'Подписчики';
    if (this.currentListType === 'possible') return 'Возможные друзья';
    return 'Ваши друзья';
  }

  async loadFriendsData() {
    const requestsRaw = await getFriendRequests();
    const subscribers = requestsRaw.map((req) => ({
      userID: req.userID,
      name: req.fullName,
      avatarPath: req.avatarPath || null,
      age: req.dob ? calculateAge(req.dob) : null,
      type: 'subscribers',
    }));

    const friendsRaw = await getFriends();
    const friends = friendsRaw.map((friend) => ({
      userID: friend.userID,
      name: friend.fullName,
      avatarPath: friend.avatarPath || null,
      age: friend.dob ? calculateAge(friend.dob) : null,
      type: 'friends',
    }));

    const possibleRaw = await getPossibleFriends();

    const possible = (possibleRaw || []).map((user) => ({
      userID: user.userID,
      name: user.fullName,
      avatarPath: user.avatarPath || null,
      age: user.dob ? calculateAge(user.dob) : null,
      type: 'possible',
    }));

    this.friendsData = { friends, subscribers, possible };
  }

  renderCurrentList() {
    const data = this.friendsData[this.currentListType];
    if (!data) return null;

    return renderFriendsList({
      friends: data,
      listType: this.currentListType,
    });
  }

  addStatsEventListeners(sidebarContainer, contentContainer) {
    const statsButtons = sidebarContainer.querySelectorAll('.friends-stats__item');

    statsButtons.forEach((button) => {
      button.addEventListener('click', (event) => {
        const listType = event.currentTarget.dataset.type;
        if (listType && listType !== this.currentListType) {
          this.currentListType = listType;
          this.rerenderList(contentContainer, sidebarContainer);
          this.changeHeader();
        }
      });
    });
  }

  rerenderList(contentContainer, sidebarContainer) {
    const oldList = contentContainer.querySelector('.friends-list');
    if (oldList) oldList.remove();

    const newList = this.renderCurrentList();
    if (newList) contentContainer.appendChild(newList);

    const oldStats = sidebarContainer.querySelector('.friends-stats');
    if (oldStats) oldStats.remove();

    const newStats = renderFriendsStats({
      friendsCount: this.friendsData.friends.length,
      subscribersCount: this.friendsData.subscribers.length,
      possibleCount: this.friendsData.possible.length,
      currentType: this.currentListType,
    });
    sidebarContainer.appendChild(newStats);
    this.addStatsEventListeners(sidebarContainer, contentContainer);
  }

  changeHeader() {
    const header = this.wrapper.querySelector('.friends-page__title');
    if (header) header.textContent = this.getTitle();
  }
}
