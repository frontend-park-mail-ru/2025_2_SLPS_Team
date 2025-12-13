import BasePage from '../BasePage.js';
import CommunityPageTemplate from './CommunityPage.hbs';
import './CommunityPage.css';

import { CreateCommunityModal } from '../../components/organisms/CreateCommunityModal/CreateCommunityModal.ts';
import { renderCommunityCard } from '../../components/molecules/CommunityCard/CommunityCard.ts';
import { renderCommunityCreated } from '../../components/molecules/CommunityCreated/CommunityCreated.ts';

import {
  createCommunity,
  getMyCommunities,
  getOtherCommunities,
  toggleCommunitySubscription,
  getCreatedCommunities,
  UPLOADS_BASE,
} from '../../shared/api/communityApi.ts';

import { navigateTo } from '../../app/router/navigateTo.js';

function formatSubscribers(count) {
  if (count == null) return '';
  if (count >= 1000) {
    const short = (count / 1000).toFixed(1).replace('.0', '');
    return `${short}k подписчиков`;
  }
  return `${count} подписчиков`;
}

function mapCommunityFromApi(item, forceSubscribed = null) {
  const avatarPath =
    !item.avatarPath || item.avatarPath === 'null'
      ? '/public/globalImages/DefaultAvatar.svg'
      : `${UPLOADS_BASE}${item.avatarPath}`;

  return {
    id: item.id,
    name: item.name,
    description: item.description,
    subscribers: formatSubscribers(item.subscribersCount || 0),
    avatar: avatarPath,
    isSubscribed:
      forceSubscribed != null ? forceSubscribed : !!item.isSubscribed,
  };
}

export class CommunityPage extends BasePage {
  constructor(rootElement) {
    super(rootElement);

    this.type = 'subs'; // 'subs' | 'reco'
    this.query = '';
    this.root = null;
    this.createModal = null;

    this.subs = [];
    this.reco = [];
    this.created = [];
  }

  async loadCommunities() {
    try {
      const [myRaw, otherRaw, createdRaw] = await Promise.all([
        getMyCommunities(1, 50),
        getOtherCommunities(1, 50),
        getCreatedCommunities(1, 50),
      ]);

      this.subs = (myRaw || []).map((c) => mapCommunityFromApi(c, true));
      this.reco = (otherRaw || []).map((c) => mapCommunityFromApi(c, false));

      this.created = (createdRaw || []).map((item) => ({
        id: item.id,
        name: item.name,
        avatar:
          !item.avatarPath || item.avatarPath === 'null'
            ? '/public/globalImages/DefaultAvatar.svg'
            : `${UPLOADS_BASE}${item.avatarPath}`,
      }));
    } catch (err) {
      console.error('[CommunityPage] loadCommunities error', err);
      this.subs = [];
      this.reco = [];
      this.created = [];
    }
  }

  async render() {
    const existing = document.getElementById('page-wrapper');
    if (existing) existing.remove();

    this.wrapper = document.createElement('div');
    this.wrapper.id = 'page-wrapper';

    const page = document.createElement('div');
    page.innerHTML = CommunityPageTemplate();

    this.root = page.firstElementChild;

    await this.loadCommunities();

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
        onSubmit: async ({ name, about }) => {
      try {
        const formData = new FormData();
        formData.append('name', name);
        if (about) {
          formData.append('description', about);
        }

        const created = await createCommunity(formData);

        const rawCommunity = created.community || created;

        if (!rawCommunity || !rawCommunity.id) {
          console.warn('[CommunityPage] createCommunity without id', created);
          await this.loadCommunities();
          this.renderList();
          this.renderCreated();
          return;
        }

        const createdWithLocal = {
          ...rawCommunity,
          name,
          description: about,
        };

        const mapped = mapCommunityFromApi(createdWithLocal, true);

        this.subs.unshift(mapped);

        this.created.unshift({
          id: mapped.id,
          name: mapped.name,
          avatar: mapped.avatar,
        });

        this.renderList();
        this.renderCreated();
      } catch (err) {
        console.error('[CommunityPage] createCommunity error', err);
        alert('Не удалось создать сообщество. Попробуйте позже.');
      }
    },


          onCancel: () => {},
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
    if (!list) return;

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
        onClick: (id) => navigateTo(`/community/${id}`),
      });

      list.appendChild(card);
    });
  }

  async toggleSubscribe(id) {
    const src = this.getCurrentSource();
    const target = src.find((i) => i.id === id);
    if (!target) return;

    const prev = target.isSubscribed;

    target.isSubscribed = !prev;
    this.renderList();

    try {
      const res = await toggleCommunitySubscription(id, prev);
      target.isSubscribed = !!res.isSubscribed;
      this.renderList();
    } catch (err) {
      console.error('[CommunityPage] toggleSubscribe error', err);
      target.isSubscribed = prev;
      this.renderList();
    }
  }

  renderCreated() {
    const container = this.root.querySelector(
      '.community-sidebar__created-list',
    );
    if (!container){
      console.log('ccccc')
      return;

    }
    container.innerHTML = '';

    this.created.forEach((item) => {
      console.log(item);
      const createdItem = renderCommunityCreated({
        id: item.id,
        name: item.name,
        avatar: item.avatar,
        onClick: (id) => navigateTo(`/community/${id}`),
      });
      console.log(createdItem);
      container.appendChild(createdItem);
    });
  }
}
