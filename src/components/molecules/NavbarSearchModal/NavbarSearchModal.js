import Template from './NavbarSearchModal.hbs';
import './NavbarSearchModal.css';
import { navigateTo } from '../../../app/router/navigateTo.js';

import {
  getFriends,
  getPossibleFriends,
  searchProfiles,
  sendFriendRequest,
} from '../../../shared/api/friendsApi.js';

export class NavbarSearchModal {
  constructor(containerEl, baseUploadsUrl) {
    this.containerEl = containerEl;
    this.baseUrl = baseUploadsUrl;

    this.rootEl = null;
    this.listEl = null;
    this.moreBtn = null;
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
    this.listEl = this.rootEl.querySelector('.navbar-search-modal__list');
    this.moreBtn = this.rootEl.querySelector('.navbar-search-modal__more');

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

    this.moreBtn.addEventListener('click', () => {
        this.close();
        navigateTo('/friends');
    });
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
      this.inputEl.focus();
    }
  }

  handleDocumentClick(e) {
    if (!this.rootEl) return;
    if (!this.rootEl.contains(e.target) && !this.containerEl.contains(e.target)) {
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
    if (!append) {
      this.listEl.innerHTML = '';
    }

    if (!users || users.length === 0) {
      if (!append) {
        const empty = document.createElement('div');
        empty.textContent = 'Ничего не найдено';
        empty.style.padding = '4px 0';
        this.listEl.appendChild(empty);
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
        btn.addEventListener('click', async () => {
          try {
            await sendFriendRequest(user.userID);
            btn.textContent = 'Заявка отправлена';
            btn.classList.add('navbar-search-item__action--muted');
            btn.onclick = null;
          } catch (e) {
            console.error('[NavbarSearchModal] Ошибка отправки заявки', e);
          }
        });
      }

      row.appendChild(left);
      row.appendChild(btn);
      this.listEl.appendChild(row);
    });
  }


  async loadInitial() {
    try {
      this.currentQuery = '';
      this.currentPage = 1;

      const [friends, possible] = await Promise.all([
        getFriends(1, 5),
        getPossibleFriends(1, 5),
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

      this.loadedInitial = true;
      this.renderUsers([...preparedFriends, ...preparedPossible], { append: false });
    } catch (e) {
      console.error('[NavbarSearchModal] Ошибка получения начальных друзей', e);
    }
  }

  async loadMoreInitial() {
  }

  async runSearch(query) {
    try {
      const profiles = await searchProfiles(query, undefined, 1, 10);
      this.renderUsers(profiles, { append: false });
    } catch (e) {
      console.error('[NavbarSearchModal] Ошибка поиска', e);
    }
  }

  async loadMoreSearch() {
    try {
      this.currentPage += 1;
      const profiles = await searchProfiles(
        this.currentQuery,
        undefined,
        this.currentPage,
        10,
      );
      this.renderUsers(profiles, { append: true });
    } catch (e) {
      console.error('[NavbarSearchModal] Ошибка догрузки поиска', e);
    }
  }
}
