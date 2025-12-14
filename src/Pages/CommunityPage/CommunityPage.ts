import BasePage from '../BasePage';
import CommunityPageTemplate from './CommunityPage.hbs';
import './CommunityPage.css';

import { CreateCommunityModal } from '../../components/organisms/CreateCommunityModal/CreateCommunityModal';
import { renderCommunityCard } from '../../components/molecules/CommunityCard/CommunityCard';
import { renderCommunityCreated } from '../../components/molecules/CommunityCreated/CommunityCreated';

import {
  createCommunity,
  getMyCommunities,
  getOtherCommunities,
  toggleCommunitySubscription,
  getCreatedCommunities,
  UPLOADS_BASE,
} from '../../shared/api/communityApi';

import { navigateTo } from '../../app/router/navigateTo';

type PageType = 'subs' | 'reco';

interface CommunityApiDTO {
  id: number;
  name: string;
  description?: string | null;
  avatarPath?: string | null;
  subscribersCount?: number | null;
  isSubscribed?: boolean | null;
}

interface CreatedCommunityApiDTO {
  id: number;
  name: string;
  avatarPath?: string | null;
}

interface CommunityListItem {
  id: number;
  name: string;
  description: string;
  subscribers: string;
  avatar: string;
  isSubscribed: boolean;
}

interface CreatedCommunityItem {
  id: number;
  name: string;
  avatar: string;
}

function formatSubscribers(count?: number | null): string {
  if (count == null) return '';
  if (count >= 1000) {
    const short = (count / 1000).toFixed(1).replace('.0', '');
    return `${short}k подписчиков`;
  }
  return `${count} подписчиков`;
}

function mapCommunityFromApi(item: CommunityApiDTO, forceSubscribed: boolean | null = null): CommunityListItem {
  const avatarPath =
    !item.avatarPath || item.avatarPath === 'null'
      ? '/public/globalImages/DefaultAvatar.svg'
      : `${UPLOADS_BASE}${item.avatarPath}`;

  return {
    id: item.id,
    name: item.name,
    description: item.description ?? '',
    subscribers: formatSubscribers(item.subscribersCount ?? 0),
    avatar: avatarPath,
    isSubscribed: forceSubscribed != null ? forceSubscribed : Boolean(item.isSubscribed),
  };
}

function mustBeHTMLElement<T extends HTMLElement>(el: Element | null, selector: string): T {
  if (!(el instanceof HTMLElement)) {
    throw new Error(`[CommunityPage] Element not found: ${selector}`);
  }
  return el as T;
}

export class CommunityPage extends BasePage {
  private type: PageType = 'subs';
  private query = '';

  private root: HTMLElement | null = null;
  private wrapper: HTMLElement | null = null;

  private createModal: CreateCommunityModal | null = null;

  private subs: CommunityListItem[] = [];
  private reco: CommunityListItem[] = [];
  private created: CreatedCommunityItem[] = [];

  constructor(rootElement: HTMLElement) {
    super(rootElement);
  }

  private async loadCommunities(): Promise<void> {
    try {
      const [myRaw, otherRaw, createdRaw] = await Promise.all([
        getMyCommunities(1, 50) as Promise<CommunityApiDTO[]>,
        getOtherCommunities(1, 50) as Promise<CommunityApiDTO[]>,
        getCreatedCommunities(1, 50) as Promise<CreatedCommunityApiDTO[]>,
      ]);

      this.subs = (myRaw ?? []).map((c) => mapCommunityFromApi(c, true));
      this.reco = (otherRaw ?? []).map((c) => mapCommunityFromApi(c, false));

      this.created = (createdRaw ?? []).map((item) => ({
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

  async render(): Promise<void> {
    const existing = document.getElementById('page-wrapper');
    if (existing) existing.remove();

    this.wrapper = document.createElement('div');
    this.wrapper.id = 'page-wrapper';

    const page = document.createElement('div');
    page.innerHTML = CommunityPageTemplate({});

    const rootEl = page.firstElementChild;
    if (!(rootEl instanceof HTMLElement)) {
      throw new Error('[CommunityPage] root element not found in template');
    }
    this.root = rootEl;

    await this.loadCommunities();

    this.initCreateButton();
    this.initTabs();
    this.initSearch();
    this.renderList();
    this.renderCreated();

    this.wrapper.appendChild(this.root);
    this.rootElement.appendChild(this.wrapper);
  }

  private initCreateButton(): void {
    if (!this.root) return;

    const btn = this.root.querySelector<HTMLElement>('.community-sidebar__create-btn');
    if (!btn) return;

    btn.addEventListener('click', () => {
      if (!this.createModal) {
        this.createModal = new CreateCommunityModal({
          onSubmit: async ({ name, about }) => {
            try {
              const formData = new FormData();
              formData.append('name', name);
              if (about) formData.append('description', about);

              const created = await createCommunity(formData) as unknown as { community?: CommunityApiDTO } | CommunityApiDTO;

              const rawCommunity: CommunityApiDTO | undefined =
                'community' in (created as any) ? (created as any).community : (created as any);

              if (!rawCommunity || !rawCommunity.id) {
                await this.loadCommunities();
                this.renderList();
                this.renderCreated();
                return;
              }

              const createdWithLocal: CommunityApiDTO = {
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

  private initTabs(): void {
    if (!this.root) return;

    const tabs = Array.from(this.root.querySelectorAll<HTMLElement>('.community-tab'));

    tabs.forEach((btn) => {
      btn.addEventListener('click', () => {
        const next = btn.dataset.type as PageType | undefined;
        if (!next || next === this.type) return;

        this.type = next;

        tabs.forEach((b) => b.classList.remove('community-tab--active'));
        btn.classList.add('community-tab--active');

        this.renderList();
      });
    });
  }

  private initSearch(): void {
    if (!this.root) return;

    const input = this.root.querySelector<HTMLInputElement>('.community-search-input');
    if (!input) return;

    input.addEventListener('input', () => {
      this.query = input.value.trim().toLowerCase();
      this.renderList();
    });
  }

  private getCurrentSource(): CommunityListItem[] {
    return this.type === 'subs' ? this.subs : this.reco;
  }

  private getFilteredItems(): CommunityListItem[] {
    const src = this.getCurrentSource();
    if (!this.query) return src;

    return src.filter((item) => {
      const text = `${item.name} ${item.description || ''}`.toLowerCase();
      return text.includes(this.query);
    });
  }

  private renderList(): void {
    if (!this.root) return;

    const list = this.root.querySelector<HTMLElement>('.community-list');
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
        onToggleSubscribe: (id: string | number) => void this.toggleSubscribe(Number(id)),
        onClick: (id: string | number) => navigateTo(`/community/${Number(id)}`),
      });

      if (card) list.appendChild(card);
    });
  }

  private async toggleSubscribe(id: number): Promise<void> {
    const src = this.getCurrentSource();
    const target = src.find((i) => i.id === id);
    if (!target) return;

    const prev = target.isSubscribed;

    target.isSubscribed = !prev;
    this.renderList();

    try {
      const res = await toggleCommunitySubscription(id, prev) as { isSubscribed?: boolean | null };
      target.isSubscribed = Boolean(res?.isSubscribed);
      this.renderList();
    } catch (err) {
      console.error('[CommunityPage] toggleSubscribe error', err);
      target.isSubscribed = prev;
      this.renderList();
    }
  }

  private renderCreated(): void {
    if (!this.root) return;

    const container = this.root.querySelector<HTMLElement>('.community-sidebar__created-list');
    if (!container) return;

    container.innerHTML = '';

    this.created.forEach((item) => {
      const createdItem = renderCommunityCreated({
        id: item.id,
        name: item.name,
        avatar: item.avatar,
        onClick: (id: string | number) => navigateTo(`/community/${Number(id)}`),
      });

      if (createdItem) container.appendChild(createdItem);
    });
  }
}
