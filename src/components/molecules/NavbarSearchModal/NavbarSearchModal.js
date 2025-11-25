import Template from './NavbarSearchModal.hbs';
import './NavbarSearchModal.css';
import { navigateTo } from '../../../app/router/navigateTo.js';

import {
  getFriends,
  getPossibleFriends,
  searchProfiles,
  sendFriendRequest,
} from '../../../shared/api/friendsApi.js';

import {
  getMyCommunities,
  getOtherCommunities,
  searchCommunities,
} from '../../../shared/api/communityApi.js';

export class NavbarSearchModal {
  constructor(containerEl, baseUploadsUrl) {
    this.containerEl = containerEl;
    this.baseUrl = baseUploadsUrl;

    this.rootEl = null;

    this.usersListEl = null;
    this.communitiesListEl = null;

    this.moreFriendsBtn = null;
    this.moreCommunitiesBtn = null;

    this.inputEl = null;

    this.debounceTimer = null;
    this.loadedInitial = false;

    this.currentQuery = '';
    this.currentPage = 1;

    this.handleDocumentClick = this.handleDocumentClick.bind(this);
  }

  init(inputEl) {
    this.inputEl = inputEl;

    const html = Template();
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html.trim();

    this.rootEl = wrapper.firstChild;

    this.usersListEl = this.rootEl.querySelector(
      '.navbar-search-modal__list--users',
    );
    this.communitiesListEl = this.rootEl.querySelector(
      '.navbar-search-modal__list--communities',
    );

    this.moreFriendsBtn = this.rootEl.querySelector(
      '.navbar-search-modal__more--friends',
    );
    this.moreCommunitiesBtn = this.rootEl.querySelector(
      '.navbar-search-modal__more--communities',
    );

    this.containerEl.appendChild(this.rootEl);

    // события
    this.inputEl.addEventListener('focus', () => this.open());
    this.inputEl.addEventListener('input', () => this.handleInput());

    this.inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.close();
        this.inputEl.blur();
      }
    });

    if (this.moreFriendsBtn) {
      this.moreFriendsBtn.addEventListener('click', () => {
        this.close();
        navigateTo('/friends');
      });
    }

    if (this.moreCommunitiesBtn) {
      this.moreCommunitiesBtn.addEventListener('click', () => {
        this.close();
        navigateTo('/community');
      });
    }
  }

  open() {
    if (!this.rootEl) return;

    this.rootEl.classList.add('navbar-search-modal--open');

    if (!this.loadedInitial) {
      this.loadInitial();
    }

    document.addEventListener('click', this.handleDocumentClick);
  }

  close() {
    if (!this.rootEl) return;

    this.rootEl.classList.remove('navbar-search-modal--open');
    document.removeEventListener('click', this.handleDocumentClick);
  }

  toggle() {
    if (!this.rootEl) return;
    if (this.rootEl.classList.contains('navbar-search-modal--open')) {
      this.close();
    } else {
      this.open();
      this.inputEl?.focus();
    }
  }

  handleDocumentClick(e) {
    if (!this.rootEl) return;
    if (
      !this.rootEl.contains(e.target) &&
      !this.containerEl.contains(e.target)
    ) {
      this.close();
    }
  }

  handleInput() {
    const value = this.inputEl.value.trim();
    this.currentQuery = value;
    this.currentPage = 1;

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      if (!value) {
        this.loadInitial();
      } else {
        this.runSearch(value);
      }
    }, 300);
  }

  avatarUrl(path) {
    if (!path || path === 'null') {
      return '/public/globalImages/DefaultAvatar.svg';
    }
    return `${this.baseUrl}${path}`;
  }


  renderUsers(users, { append = false } = {}) {
    if (!this.usersListEl) return;

    if (!append) {
      this.usersListEl.innerHTML = '';
    }

    if (!users || users.length === 0) {
      if (!append) {
        const empty = document.createElement('div');
        empty.textContent = 'Ничего не найдено';
        empty.style.padding = '4px 0';
        this.usersListEl.appendChild(empty);
      }
      return;
    }

    users.forEach((user) => {
      const row = document.createElement('div');
      row.className = 'navbar-search-item';

      const left = document.createElement('div');
      left.className = 'navbar-search-item__left';

      const img = document.createElement('img');
      img.className = 'navbar-search-item__avatar';
      img.src = this.avatarUrl(user.avatarPath);
      img.alt = user.fullName;

      const name = document.createElement('div');
      name.className = 'navbar-search-item__name';
      name.textContent = user.fullName;

      left.appendChild(img);
      left.appendChild(name);

      const btn = document.createElement('button');
      btn.className = 'navbar-search-item__action';

      const status = user.status || user.type || null;

      if (status === 'accepted') {
        btn.textContent = 'У вас в друзьях';
        btn.classList.add('navbar-search-item__action--muted');
      } else if (status === 'pending' || status === 'sent') {
        btn.textContent = 'Заявка отправлена';
        btn.classList.add('navbar-search-item__action--muted');
      } else {
        btn.textContent = 'Добавить в друзья';
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          try {
            await sendFriendRequest(user.userID);
            btn.textContent = 'Заявка отправлена';
            btn.classList.add('navbar-search-item__action--muted');
            btn.onclick = null;
          } catch (err) {
            console.error('[NavbarSearchModal] Ошибка отправки заявки', err);
          }
        });
      }

      row.addEventListener('click', (e) => {
        if (e.target.closest('.navbar-search-item__action')) return;
        this.close();
        if (user.userID) {
          navigateTo(`/profile/${user.userID}`);
        }
      });

      row.appendChild(left);
      row.appendChild(btn);
      this.usersListEl.appendChild(row);
    });
  }

  // ---------- РЕНДЕР СООБЩЕСТВ ----------

  renderCommunities(communities, { append = false } = {}) {
    if (!this.communitiesListEl) return;

    if (!append) {
      this.communitiesListEl.innerHTML = '';
    }

    if (!communities || communities.length === 0) {
      if (!append) {
        const empty = document.createElement('div');
        empty.textContent = 'Ничего не найдено';
        empty.style.padding = '4px 0';
        this.communitiesListEl.appendChild(empty);
      }
      return;
    }

    communities.forEach((community) => {
      const row = document.createElement('div');
      row.className = 'navbar-search-item';

      const left = document.createElement('div');
      left.className = 'navbar-search-item__left';

      const img = document.createElement('img');
      img.className = 'navbar-search-item__avatar';
      img.src = this.avatarUrl(
        community.avatarPath ||
          community.avatar ||
          community.avatarURL ||
          community.iconPath,
      );
      img.alt = community.name || 'Сообщество';

      const name = document.createElement('div');
      name.className = 'navbar-search-item__name';
      name.textContent = community.name || community.title || 'Сообщество';

      left.appendChild(img);
      left.appendChild(name);

      const right = document.createElement('div');
      right.className = 'navbar-search-item__action navbar-search-item__action--muted';
      if (community.subscriptionType === 'subscriber') {
        right.textContent = 'Вы подписаны';
      } else {
        right.textContent = '';
      }

      row.addEventListener('click', () => {
        this.close();
        const id = community.id || community.communityID;
        if (id) {
          navigateTo(`/community/${id}`);
        }
      });

      row.appendChild(left);
      row.appendChild(right);

      this.communitiesListEl.appendChild(row);
    });
  }


  async loadInitial() {
    try {
      this.currentQuery = '';
      this.currentPage = 1;

      const [friends, possible, myCommunities, otherCommunities] =
        await Promise.all([
          getFriends(1, 5),
          getPossibleFriends(1, 5),
          getMyCommunities(1, 5),
          getOtherCommunities(1, 5),
        ]);

      const preparedFriends = (friends || []).map((u) => ({
        userID: u.userID,
        fullName: u.fullName,
        avatarPath: u.avatarPath,
        status: 'accepted',
      }));

      const preparedPossible = (possible || []).map((u) => ({
        userID: u.userID,
        fullName: u.fullName,
        avatarPath: u.avatarPath,
        status: u.status || 'notFriends',
      }));

      const usersMerged = [...preparedFriends, ...preparedPossible];
      const usersTop3 = usersMerged.slice(0, 3);

      const preparedMyCommunities = (myCommunities || []).map((c) => ({
        ...c,
        subscriptionType: 'subscriber',
      }));

      const preparedOtherCommunities = (otherCommunities || []).map((c) => ({
        ...c,
        subscriptionType: 'notSubscriber',
      }));

      const communitiesMerged = [
        ...preparedMyCommunities,
        ...preparedOtherCommunities,
      ];
      const communitiesTop3 = communitiesMerged.slice(0, 3);

      this.loadedInitial = true;

      this.renderUsers(usersTop3, { append: false });
      this.renderCommunities(communitiesTop3, { append: false });
    } catch (e) {
      console.error(
        '[NavbarSearchModal] Ошибка получения начальных друзей/сообществ',
        e,
      );
    }
  }

  async loadMoreInitial() {
  }

  async runSearch(query) {
    try {
      const types = ['accepted', 'pending', 'sent', 'notFriends'];
      const perTypeLimit = 5;

      const profileResponses = await Promise.all(
        types.map((t) => searchProfiles(query, t, 1, perTypeLimit)),
      );

      const mergedUsers = [];

      types.forEach((type, idx) => {
        (profileResponses[idx] || []).forEach((user) => {
          mergedUsers.push({
            ...user,
            status: user.status || type,
          });
        });
      });

      const usersTop3 = mergedUsers.slice(0, 3);

      // Сообщества: сначала подписки, потом остальные
      const [subscriberCommunities, otherCommunities] = await Promise.all([
        searchCommunities(query, 'subscriber', 1, 3),
        searchCommunities(query, 'notSubscriber', 1, 3),
      ]);

      const mergedCommunities = [
        ...(subscriberCommunities || []).map((c) => ({
          ...c,
          subscriptionType: 'subscriber',
        })),
        ...(otherCommunities || []).map((c) => ({
          ...c,
          subscriptionType: 'notSubscriber',
        })),
      ];

      const communitiesTop3 = mergedCommunities.slice(0, 3);

      this.renderUsers(usersTop3, { append: false });
      this.renderCommunities(communitiesTop3, { append: false });
    } catch (e) {
      console.error('[NavbarSearchModal] Ошибка поиска', e);
    }
  }

  async loadMoreSearch() {
  }
}
