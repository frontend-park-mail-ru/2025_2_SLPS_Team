import Template from './EmojiMenu.hbs';
import './EmojiMenu.css';
import emojiData from '../../../services/Emoji/compact.raw.json';
import { SearchInput } from '../SearchInput/SearchInput';
import { searchEmojis } from '../../../services/Emoji/Emoji';
import { getStickerPacks, getPackStickers } from '../../../shared/api/stickersApi';

type StickerSelectPayload = {
  id: number;
  filePath: string;
};

type StickerPack = {
  id: number;
  name: string;
  coverPath: string;
};

type Sticker = {
  id: number;
  packId?: number;
  filePath: string;
  position?: number;
};

function toAbs(u: string): string {
  const s = (u ?? '').trim();
  if (!s) return s;
  if (s.startsWith('http://') || s.startsWith('https://')) return s;

  const base = (process.env.API_BASE_URL ?? '').replace(/\/$/, '');
  if (!base) return s;

  if (s.startsWith('/')) return `${base}${s}`;
  return `${base}/${s}`;
}

function pickEmoji(e: any): string {
  return (e?.emoji ?? e?.unicode ?? e?.char ?? '').toString();
}

export class EmojiMenu {
  private rootElement: HTMLElement;
  private onSelectEmoji: (emoji: string) => void;
  private onSelectSticker: (sticker: StickerSelectPayload) => void;

  private wrapper!: HTMLElement;
  private tabs!: NodeListOf<HTMLButtonElement>;
  private emojiPanel!: HTMLElement;
  private stickersPanel!: HTMLElement;

  private searchContainer!: HTMLElement;
  private grid!: HTMLElement;

  private packsRoot!: HTMLElement;
  private stickerGrid!: HTMLElement;

  private packs: StickerPack[] = [];
  private activePackId: number | null = null;
  private stickersInited = false;

  private searchInput!: SearchInput;

  constructor(
    rootElement: HTMLElement,
    onSelectEmoji: (emoji: string) => void,
    onSelectSticker: (sticker: StickerSelectPayload) => void,
  ) {
    this.rootElement = rootElement;
    this.onSelectEmoji = onSelectEmoji;
    this.onSelectSticker = onSelectSticker;
  }

  render(): void {
    const temp = document.createElement('div');
    temp.innerHTML = Template({});
    const root = temp.firstElementChild as HTMLElement | null;
    if (!root) return;

    this.wrapper = root;

    const tabs = root.querySelectorAll('.emoji-modal__tab') as NodeListOf<HTMLButtonElement>;
    const emojiPanel = root.querySelector('.emoji-modal__panel--emoji') as HTMLElement | null;
    const stickersPanel = root.querySelector('.emoji-modal__panel--stickers') as HTMLElement | null;

    const searchContainer = root.querySelector('.emoji-search-container') as HTMLElement | null;
    const grid = root.querySelector('.emoji-picker-grid') as HTMLElement | null;

    const packsRoot = root.querySelector('.sticker-packs') as HTMLElement | null;
    const stickerGrid = root.querySelector('.sticker-grid') as HTMLElement | null;

    if (!tabs.length || !emojiPanel || !stickersPanel || !searchContainer || !grid || !packsRoot || !stickerGrid) return;

    this.tabs = tabs;
    this.emojiPanel = emojiPanel;
    this.stickersPanel = stickersPanel;

    this.searchContainer = searchContainer;
    this.grid = grid;

    this.packsRoot = packsRoot;
    this.stickerGrid = stickerGrid;

    this.searchInput = new SearchInput(this.searchContainer);
    this.searchInput.render();
    this.searchInput.onInput((value) => this.renderEmojis(value));

    this.tabs.forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = (btn.dataset.tab as 'emoji' | 'stickers') ?? 'emoji';
        this.switchTab(tab);
      });
    });

    this.renderEmojis('');
    this.rootElement.appendChild(root);
  }

  toggle(): void {
    if (!this.wrapper) return;
    this.wrapper.classList.toggle('hidden');
  }

  hide(): void {
    if (!this.wrapper) return;
    this.wrapper.classList.add('hidden');
  }

  show(): void {
    if (!this.wrapper) return;
    this.wrapper.classList.remove('hidden');
  }

  private switchTab(tab: 'emoji' | 'stickers') {
    this.tabs.forEach((t) => t.classList.remove('active'));
    const active = this.wrapper.querySelector(`.emoji-modal__tab[data-tab="${tab}"]`) as HTMLButtonElement | null;
    if (active) active.classList.add('active');

    this.emojiPanel.classList.toggle('hidden', tab !== 'emoji');
    this.stickersPanel.classList.toggle('hidden', tab !== 'stickers');

    if (tab === 'stickers' && !this.stickersInited) {
      this.stickersInited = true;
      void this.initStickers();
    }
  }

  private renderEmojis(search: string): void {
    if (!this.grid) return;

    const q = (search ?? '').trim();
    const src = emojiData as any[];
    const results = q ? (searchEmojis(q, src as any) as any[]) : src;

    this.grid.innerHTML = '';

    if (!results.length) {
      const no = document.createElement('div');
      no.className = 'no-result-text';
      no.textContent = 'Нет результатов';
      this.grid.appendChild(no);
      return;
    }

    results.forEach((e: any) => {
      const ch = pickEmoji(e);
      if (!ch) return;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'emoji-item';
      btn.textContent = ch;
      btn.onclick = () => {
        this.onSelectEmoji(ch);
        this.hide();
      };
      this.grid.appendChild(btn);
    });
  }

  private async initStickers() {
    try {
      this.packs = (await getStickerPacks()) as StickerPack[];
      const first = this.packs[0];
      if (!first) {
        this.packsRoot.innerHTML = '';
        this.stickerGrid.innerHTML = '';
        return;
      }

      this.activePackId = first.id;
      this.renderPacks();
      await this.loadPack(first.id);
    } catch {
      this.packsRoot.innerHTML = '';
      this.stickerGrid.innerHTML = '';
    }
  }

  private renderPacks() {
    this.packsRoot.innerHTML = '';

    this.packs.forEach((p) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sticker-pack-btn' + (p.id === this.activePackId ? ' active' : '');

      const img = document.createElement('img');
      img.className = 'sticker-pack-cover';
      img.src = toAbs(p.coverPath);
      img.alt = p.name ?? 'pack';

      btn.appendChild(img);
      btn.onclick = async () => {
        this.activePackId = p.id;
        this.renderPacks();
        await this.loadPack(p.id);
      };

      this.packsRoot.appendChild(btn);
    });
  }

  private async loadPack(packId: number) {
    const stickers = (await getPackStickers(packId)) as Sticker[];
    const list = (stickers ?? []).slice().sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

    this.stickerGrid.innerHTML = '';

    if (!list.length) {
      const no = document.createElement('div');
      no.className = 'no-result-text';
      no.textContent = 'В паке нет стикеров';
      this.stickerGrid.appendChild(no);
      return;
    }

    list.forEach((s) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sticker-item';

      const img = document.createElement('img');
      img.className = 'sticker-img';
      img.src = toAbs(s.filePath);
      img.alt = `sticker-${s.id}`;

      btn.appendChild(img);
      btn.onclick = () => {
        this.onSelectSticker({ id: s.id, filePath: s.filePath });
        this.hide();
      };

      this.stickerGrid.appendChild(btn);
    });
  }
}
