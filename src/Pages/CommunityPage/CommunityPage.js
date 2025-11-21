import BasePage from '../BasePage.js';
import CommunityPageTemplate from './CommunityPage.hbs';
import './CommunityPage.css';

import { CreateCommunityModal } from '../../components/organisms/CreateCommunityModal/CreateCommunityModal.js';
import { renderCommunityCard } from '../../components/molecules/CommunityCard/CommunityCard.js';
import { renderCommunityCreated } from '../../components/molecules/CommunityCreated/CommunityCreated.js';

export class CommunityPage extends BasePage {
  constructor(rootElement) {
    super(rootElement);

    this.type = 'subs'; // 'subs' | 'reco'
    this.query = '';
    this.root = null;
    this.createModal = null;

    // Заглушки под API
    this.subs = [
      {
        id: 1,
        name: 'VK Education',
        description: 'Обучающие курсы',
        subscribers: '254,3k подписчиков',
        avatar: '/public/testData/groupim2.jpg',
        isSubscribed: true,
      },
      {
        id: 2,
        name: 'Fast Food Music',
        description: 'Музыка и релизы',
        subscribers: '12,8k подписчиков',
        avatar: '/public/testData/groupim.jpg',
        isSubscribed: true,
      },
    ];

    this.reco = [
      {
        id: 3,
        name: 'VK Education',
        description: 'Обучающие курсы',
        subscribers: '254,3k подписчиков',
        avatar: '/public/testData/groupim2.jpg',
        isSubscribed: false,
      },
    ];

    this.created = [
      {
        id: 101,
        name: 'Fast Food Music',
        avatar: '/public/testData/groupim.jpg',
      },
      {
        id: 102,
        name: 'VK education',
        avatar: '/public/testData/groupim2.jpg',
      },
    ];
  }

  async render() {
    const existing = document.getElementById('page-wrapper');
    if (existing) existing.remove();

    this.wrapper = document.createElement('div');
    this.wrapper.id = 'page-wrapper';

    const page = document.createElement('div');
    page.innerHTML = CommunityPageTemplate();

    this.root = page.firstElementChild;

    this.initCreateButton();
    this.initTabs();
    this.initSearch();
    this.renderList();
    this.renderCreated();

    this.wrapper.appendChild(this.root);
    this.rootElement.appendChild(this.wrapper);
  }

  initCreateButton() {
  const btn = this.root.querySelector('.community-sidebar__create-btn');
  if (!btn) return;

  btn.addEventListener('click', () => {
        if (!this.createModal) {
        this.createModal = new CreateCommunityModal({
            onSubmit: ({ name, about }) => {
            // в будущем будет Api для создания
            // фейковое добавление для наглядности
            this.created.push({
                id: Date.now(),
                name,
                avatar: '/public/globalImages/DefaultAvatar.svg',
            });
            this.renderCreated(this.root);
            },
            onCancel: () => {
            },
        });
        }

        this.createModal.open();
    });
  }
  initTabs() {
    const tabs = this.root.querySelectorAll('.community-tab');

    tabs.forEach((btn) => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        if (type === this.type) return;

        this.type = type;

        tabs.forEach((b) => b.classList.remove('community-tab--active'));
        btn.classList.add('community-tab--active');

        this.renderList();
      });
    });
  }

  initSearch() {
    const input = this.root.querySelector('.community-search-input');
    if (!input) return;

    input.addEventListener('input', () => {
      this.query = input.value.trim().toLowerCase();
      this.renderList();
    });
  }


  getCurrentSource() {
    return this.type === 'subs' ? this.subs : this.reco;
  }

  getFilteredItems() {
    const src = this.getCurrentSource();
    if (!this.query) return src;

    return src.filter((item) => {
      const text = `${item.name} ${item.description || ''}`.toLowerCase();
      return text.includes(this.query);
    });
  }


  renderList() {
    const list = this.root.querySelector('.community-list');
    list.innerHTML = '';

    const items = this.getFilteredItems();
    if (!items.length) {
      const empty = document.createElement('div');
      empty.className = 'community-empty';
      empty.textContent = 'Нет результатов';
      list.appendChild(empty);
      return;
    }

    items.forEach((item) => {
      const card = renderCommunityCard({
        id: item.id,
        name: item.name,
        description: item.description,
        subscribers: item.subscribers,
        avatarPath: item.avatar,
        isSubscribed: item.isSubscribed,
        onToggleSubscribe: (id) => this.toggleSubscribe(id),
        // onClick: (id) => navigateTo(`/community/${id}`) — потом можно будет добавить
      });

      list.appendChild(card);
    });
  }

  toggleSubscribe(id) {
    const src = this.getCurrentSource();
    const target = src.find((i) => i.id === id);
    if (!target) return;

    target.isSubscribed = !target.isSubscribed;
    this.renderList();
  }

  renderCreated() {
    const container = this.root.querySelector(
      '.community-sidebar__created-list',
    );
    container.innerHTML = '';

    this.created.forEach((item) => {
      const createdItem = renderCommunityCreated({
        id: item.id,
        name: item.name,
        avatar: item.avatar,
        onClick: (id) => {
          // пока просто лог, дальше можно навигейт
          console.log('Открыть сообщество', id);
          // navigateTo(`/community/${id}`);
        },
      });

      container.appendChild(createdItem);
    });
  }
}

