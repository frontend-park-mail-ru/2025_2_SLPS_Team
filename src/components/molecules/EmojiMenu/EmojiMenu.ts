import emojiData from '../../../services/Emoji/compact.raw.json';
import { SearchInput } from '../SearchInput/SearchInput';
import { searchEmojis } from '../../../services/Emoji/Emoji';
import { getStickerPacks, getPackStickers } from '../../../shared/api/stickersApi';
import './EmojiMenu.css';

type StickerPack = {
  id: number;
  name: string;
  coverPath: string;
};

type Sticker = {
  id: number;
  packId: number;
  filePath: string;
  position: number;
};

function toAbs(u: string): string {
  const s = (u ?? '').trim();
  if (!s) return s;
  if (s.startsWith('http://') || s.startsWith('https://')) return s;

  const base = (process.env.API_BASE_URL ?? '').replace(/\/$/, '');
  if (s.startsWith('/')) return `${base}${s}`;
  return `${base}/${s}`;
}

export class EmojiMenu {
  rootElement: HTMLElement;
  picker!: HTMLElement;

  searchElement!: SearchInput;
  searchEleentContainer!: HTMLElement;
  grid!: HTMLElement;

  tabs!: NodeListOf<HTMLButtonElement>;
  emojiPanel!: HTMLElement;
  stickersPanel!: HTMLElement;

  stickerPacksEl!: HTMLElement;
  stickerGridEl!: HTMLElement;

  private stickerPacks: StickerPack[] = [];
  private activePackId: number | null = null;

  onSelect: (emoji: string) => void;
  onSelectSticker: (stickerId: number) => void;

  constructor(
    rootElement: HTMLElement,
    onSelectEmoji: (emoji: string) => void,
    onSelectSticker: (stickerId: number) => void,
  ) {
    this.rootElement = rootElement;
    this.onSelect = onSelectEmoji;
    this.onSelectSticker = onSelectSticker;
  }

  render(): void {
    this.picker = this.rootElement.querySelector('.emoji-picker')!;

    this.tabs = this.rootElement.querySelectorAll('.emoji-tab');
    this.emojiPanel = this.rootElement.querySelector('.emoji-tab-content--emoji')!;
    this.stickersPanel = this.rootElement.querySelector('.emoji-tab-content--stickers')!;

    this.grid = this.rootElement.querySelector('.emoji-picker-grid')!;
    this.searchEleentContainer = this.rootElement.querySelector('.emoji-search-container')!;

    this.stickerPacksEl = this.rootElement.querySelector('.sticker-packs')!;
    this.stickerGridEl = this.rootElement.querySelector('.sticker-grid')!;

    this.searchElement = new SearchInput(this.searchEleentContainer);
    this.searchElement.render();

    this.searchElement.onInput((value) => {
      this.renderEmojis(value);
    });

    this.tabs.forEach((t) => {
      t.onclick = () => this.switchTab((t.dataset.tab as 'emoji' | 'stickers') || 'emoji');
    });

    this.renderEmojis();
    void this.initStickers();

    this.hide();
  }

  private switchTab(tab: 'emoji' | 'stickers') {
    this.tabs.forEach((t) => t.classList.remove('active'));
    const current = this.rootElement.querySelector(`.emoji-tab[data-tab="${tab}"]`);
    if (current) current.classList.add('active');

    this.emojiPanel.classList.toggle('hidden', tab !== 'emoji');
    this.stickersPanel.classList.toggle('hidden', tab !== 'stickers');
  }

  renderEmojis(search: string = ''): void {
    this.grid.innerHTML = '';

    let results: any[] = [];
    if (search.trim().length === 0) results = emojiData as any;
    else results = searchEmojis(search, emojiData as any);

    if (results.length === 0) {
      const noResultContainer = document.createElement('div') as HTMLElement;
      noResultContainer.classList.add('no-result-text');
      noResultContainer.textContent = 'Нет результатов';
      this.grid.appendChild(noResultContainer);
      return;
    }

    results.forEach((e: any) => {
      const btn = document.createElement('button');
      btn.className = 'emoji-item';
      btn.type = 'button';
      btn.textContent = e.unicode;
      btn.onclick = () => this.onSelect(e.unicode);
      this.grid.appendChild(btn);
    });
  }

  private async initStickers() {
    const packs = (await getStickerPacks()) as StickerPack[];
    this.stickerPacks = packs ?? [];
    this.renderStickerPacks();

    const firstPack = this.stickerPacks.at(0);
    if (firstPack) {
    await this.openStickerPack(firstPack.id);
    }
  }

  private renderStickerPacks() {
    this.stickerPacksEl.innerHTML = '';

    if (!this.stickerPacks.length) {
      const no = document.createElement('div');
      no.className = 'no-result-text';
      no.textContent = 'Нет стикерпаков';
      this.stickerPacksEl.appendChild(no);
      return;
    }

    this.stickerPacks.forEach((p) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sticker-pack-btn';
      if (this.activePackId === p.id) btn.classList.add('active');

      const img = document.createElement('img');
      img.className = 'sticker-pack-cover';
      img.src = toAbs(p.coverPath);
      img.alt = p.name ?? 'pack';

      btn.appendChild(img);
      btn.onclick = async () => {
        await this.openStickerPack(p.id);
        this.renderStickerPacks();
      };

      this.stickerPacksEl.appendChild(btn);
    });
  }

  private async openStickerPack(packId: number) {
    this.activePackId = packId;

    const stickers = (await getPackStickers(packId)) as Sticker[];
    const list = (stickers ?? []).slice().sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

    this.stickerGridEl.innerHTML = '';

    if (!list.length) {
      const no = document.createElement('div');
      no.className = 'no-result-text';
      no.textContent = 'В паке нет стикеров';
      this.stickerGridEl.appendChild(no);
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
      btn.onclick = () => this.onSelectSticker(s.id);

      this.stickerGridEl.appendChild(btn);
    });
  }

  show() {
    this.picker.classList.remove('hidden');
  }
  hide() {
    this.picker.classList.add('hidden');
  }
  toggle() {
    this.picker.classList.toggle('hidden');
  }
}
