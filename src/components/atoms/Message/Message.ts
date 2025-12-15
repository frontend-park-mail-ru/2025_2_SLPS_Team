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
  private wrapper: HTMLElement | null = null;

  constructor(
    private rootElement: HTMLElement,
    private messageData: MessageData,
    private isMine: boolean,
    private isLastInGroup: boolean,
    private withAnimation: boolean,
  ) {}

  render(): HTMLElement | null {
    const data = this.messageData as any;

    const text: string = typeof data.text === 'string' ? data.text : '';
    const createdAt: unknown = data.createdAt ?? data.created_at ?? data.time;

    const attachmentsRaw: unknown = data.attachments;
    const attachments: string[] = Array.isArray(attachmentsRaw)
      ? attachmentsRaw.filter((x: unknown): x is string => typeof x === 'string' && x.length > 0)
      : [];

    const images: string[] = attachments.filter((url) => this.isImageUrl(url));
    const files: NormalizedFile[] = attachments
      .filter((url) => !this.isImageUrl(url))
      .map((url) => ({ name: this.extractName(url), url }));

    const hasAttachments = images.length > 0 || files.length > 0;

    const html = MessageTemplate({
      ...data,
      text,
      time: this.formatTime(createdAt),
      isMine: this.isMine,
      hasAttachments,
      images,
      files,
      isEmoji: this.isSingleEmoji(text),
    });

    this.wrapper = document.createElement('div');
    this.wrapper.innerHTML = html.trim();

    const container = this.wrapper.firstElementChild as HTMLElement | null;
    if (!container) return null;

    if (this.isLastInGroup) container.classList.add('last-in-group');
    if (!this.isMine) container.classList.add('last-not-mine');
    if (!this.withAnimation) container.classList.add('no-anim');

    if (files.length > 0) {
      const filesRoot = container.querySelector('.message-attachments-files') as HTMLElement | null;
      if (filesRoot) {
        filesRoot.innerHTML = '';
        files.forEach((file) => {
          const item = new FileItem(filesRoot, { fileUrl: file.url, canDelete: false });
          void item.render();
        });
      }
    }
    this.rootElement.appendChild(container);
    return container;
  }

  private stripQuery(url: string): string {
    const q = url.indexOf('?');
    return q === -1 ? url : url.slice(0, q);
  }

  private isImageUrl(url: string): boolean {
    const clean = this.stripQuery(url).toLowerCase();
    return /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(clean);
  }

  private extractName(url: string): string {
    const clean = this.stripQuery(url);
    const idx = clean.lastIndexOf('/');
    const tail = idx >= 0 ? clean.slice(idx + 1) : clean;

    const safeTail = tail.length ? tail : 'file';

    try {
      const decoded = decodeURIComponent(safeTail);
      return decoded.length ? decoded : 'file';
    } catch {
      return safeTail;
    }
  }

  private formatTime(value: unknown): string {
    if (!value) return '';
    const date = new Date(value as any);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  private isSingleEmoji(text: string): boolean {
    const t = text.trim();
    if (!t) return false;
    const matches = Array.from(t.matchAll(regex)).map((m) => m[0]);
    return matches.length === 1 && matches[0] === t;
  }
}
