import MessageTemplate from './Message.hbs';
import type { MessageData } from '@shared/types/components';
import emojiRegex from 'emoji-regex';
import { FileItem } from '../FileItem/FileItem';

const regex = emojiRegex();

type NormalizedFile = {
  name: string;
  url: string;
};

export class Message {
  constructor(
    private rootElement: HTMLElement,
    private messageData: MessageData,
    private isMine: boolean,
    private isLastInGroup: boolean,
    private withAnimation: boolean,
  ) {}

  render(): HTMLElement | null {
    const data = this.messageData as any;
    const id = data?.id;

    const text = typeof data?.text === 'string' ? data.text : '';
    const createdAt = data?.createdAt ?? data?.created_at ?? data?.time;

    const attachments: string[] = Array.isArray(data?.attachments)
      ? data.attachments.filter((x: unknown): x is string => typeof x === 'string')
      : [];

    const images = attachments.filter((u) => this.isImageUrl(u));
    const files: NormalizedFile[] = attachments
      .filter((u) => !this.isImageUrl(u))
      .map((u) => ({ name: this.extractName(u), url: u }));

    const html = MessageTemplate({
      ...data,
      text,
      time: this.formatTime(createdAt),
      isMine: this.isMine,
      hasAttachments: images.length || files.length,
      images,
      files,
      isEmoji: this.isSingleEmoji(text),
    });

    const wrapper = document.createElement('div');
    wrapper.innerHTML = html.trim();

    const el = wrapper.firstElementChild as HTMLElement | null;
    if (!el) return null;

    if (this.isLastInGroup) el.classList.add('last-in-group');
    if (!this.isMine) el.classList.add('last-not-mine');
    if (!this.withAnimation) el.classList.add('no-anim');

    if (files.length) {
      const filesRoot = el.querySelector('.message-attachments-files') as HTMLElement | null;
      if (filesRoot) {
        filesRoot.innerHTML = '';
        files.forEach((f) => {
          const item = new FileItem(filesRoot, { fileUrl: f.url, canDelete: false });
          void item.render();
        });
      }
    }

    if (id !== undefined) {
      const old = this.rootElement.querySelector(`[data-message-id="${id}"]`);
      if (old) old.remove();
    }

    this.rootElement.appendChild(el);

    return el;
  }

    private isImageUrl(url: string): boolean {
    const idx = url.indexOf('?');
    const clean = idx === -1 ? url : url.slice(0, idx);
    return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(clean);
    }
    private extractName(url: string): string {
    const q = url.indexOf('?');
    const clean = q === -1 ? url : url.slice(0, q);

    const slash = clean.lastIndexOf('/');
    const name = slash === -1 ? clean : clean.slice(slash + 1);

    if (!name) return 'file';

    try {
        const decoded = decodeURIComponent(name);
        return decoded || 'file';
    } catch {
        return name;
    }
    }

  private formatTime(v: unknown): string {
    if (!v) return '';
    const d = new Date(v as any);
    return Number.isNaN(d.getTime())
      ? ''
      : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  private isSingleEmoji(text: string): boolean {
    const t = text.trim();
    if (!t) return false;
    const m = Array.from(t.matchAll(regex)).map((x) => x[0]);
    return m.length === 1 && m[0] === t;
  }
}
