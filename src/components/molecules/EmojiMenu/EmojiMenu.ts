import Template from './EmojiMenu.hbs';
import './EmojiMenu.css';
import emojiData from '../../../services/Emoji/compact.raw.json';
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
  filePath: string;
};

function toAbs(u: string): string {
  if (!u) return u;
  if (u.startsWith('http')) return u;
  const base = (process.env.API_BASE_URL ?? '').replace(/\/$/, '');
  return u.startsWith('/') ? `${base}${u}` : `${base}/${u}`;
}

export class EmojiMenu {
  private rootElement: HTMLElement;
  private onSelect: (emoji: string) => void;
  private onSelectSticker: (sticker: StickerSelectPayload) => void;

  private wrapper!: HTMLElement;
  private emojiGrid!: HTMLElement;
  private searchRoot!: HTMLElement;
  private packsRoot!: HTMLElement;
  private stickerGrid!: HTMLElement;

  private packs: StickerPack[] = [];
  private activePackId: number | null = null;

  constructor(
    rootElement: HTMLElement,
    onSelectEmoji: (emoji: string) => void,
    onSelectSticker: (sticker: StickerSelectPayload) => void,
  ) {
    this.rootElement = rootElement;
    this.onSelect = onSelectEmoji;
    this.onSelectSticker = onSelectSticker;
  }

  render(): void {
    const temp = document.createElement('div');
    temp.innerHTML = Template({});
    const root = temp.firstElementChild as HTMLElement;
    this.wrapper = root;

    this.emojiGrid = root.querySelector('.emoji-picker-grid') as HTMLElement;
    this.searchRoot = root.querySelector('.emoji-search-container') as HTMLElement;
    this.packsRoot = root.querySelector('.sticker-packs') as HTMLElement;
    this.stickerGrid = root.querySelector('.sticker-grid') as HTMLElement;

    this.initTabs();
    this.renderEmojiGrid(emojiData);

    void this.initStickers();

    this.rootElement.appendChild(root);
  }

  toggle(): void {
    this.wrapper.classList.toggle('hidden');
  }

  hide(): void {
    this.wrapper.classList.add('hidden');
  }

  private initTabs() {
    const tabs = this.wrapper.querySelectorAll('.emoji-tab');
    const emojiTab = this.wrapper.querySelector('.emoji-tab-content--emoji') as HTMLElement;
    const stickerTab = this.wrapper.querySelector('.emoji-tab-content--stickers') as HTMLElement;

    tabs.forEach((btn) => {
      btn.addEventListener('click', () => {
        tabs.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        const tab = btn.getAttribute('data-tab');
        if (tab === 'emoji') {
          emojiTab.classList.remove('hidden');
          stickerTab.classList.add('hidden');
        } else {
          stickerTab.classList.remove('hidden');
          emojiTab.classList.add('hidden');
        }
      });
    });
  }

  private renderEmojiGrid(list: any[]) {
    this.emojiGrid.innerHTML = '';

    list.forEach((e) => {
      const btn = document.createElement('button');
      btn.className = 'emoji-item';
      btn.textContent = e.emoji;
      btn.onclick = () => {
        this.onSelect(e.emoji);
        this.hide();
      };
      this.emojiGrid.appendChild(btn);
    });
  }

  private async initStickers() {
    this.packs = await getStickerPacks();
    const first = this.packs[0];
    if (!first) return;

    this.activePackId = first.id;
    this.renderPacks();
    await this.loadPack(first.id);
  }

  private renderPacks() {
    this.packsRoot.innerHTML = '';

    this.packs.forEach((p) => {
      const btn = document.createElement('button');
      btn.className = 'sticker-pack-btn' + (p.id === this.activePackId ? ' active' : '');

      const img = document.createElement('img');
      img.className = 'sticker-pack-cover';
      img.src = toAbs(p.coverPath);

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
    const stickers: Sticker[] = await getPackStickers(packId);
    this.stickerGrid.innerHTML = '';

    stickers.forEach((s) => {
      const btn = document.createElement('button');
      btn.className = 'sticker-item';

      const img = document.createElement('img');
      img.className = 'sticker-img';
      img.src = toAbs(s.filePath);

      btn.appendChild(img);
      btn.onclick = () => {
        this.onSelectSticker({ id: s.id, filePath: s.filePath });
        this.hide();
      };

      this.stickerGrid.appendChild(btn);
    });
  }
}
