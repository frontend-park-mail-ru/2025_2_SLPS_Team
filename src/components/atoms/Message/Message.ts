import MessageTemplate from './Message.hbs';
import type { MessageData } from '@shared/types/components';
import emojiRegex from 'emoji-regex';
import { FileItem } from '../FileItem/FileItem';

const regex = emojiRegex();

type NormalizedFile = { name: string; url: string };

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

    const id: number | string | undefined = data?.id;
    const text: string = typeof data?.text === 'string' ? data.text : '';
    const createdAt: unknown = data?.createdAt ?? data?.created_at ?? data?.time;

    const attachmentsRaw: unknown = data?.attachments;
    const attachments: string[] = Array.isArray(attachmentsRaw)
      ? attachmentsRaw.filter((x: unknown): x is string => typeof x === 'string' && x.length > 0)
      : [];

    const images: string[] = attachments.filter((u) => this.isImageUrl(u));

    const files: NormalizedFile[] = attachments
      .filter((u) => !this.isImageUrl(u))
      .map((u) => ({ name: this.extractName(u), url: u }));

    const html = MessageTemplate({
      ...data,
      text,
      time: this.formatTime(createdAt),
      isMine: this.isMine,
      hasAttachments: images.length > 0 || files.length > 0,
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

    if (files.length > 0) {
      const filesRoot = el.querySelector('.message-attachments-files') as HTMLElement | null;
      if (filesRoot) {
        filesRoot.innerHTML = '';
        files.forEach((f) => {
          const item = new FileItem(filesRoot, { fileUrl: f.url, canDelete: false });
          void item.render();
        });
      }
    }

    const insertOrReplace = () => {
      if (el.isConnected) return;

      if (id !== undefined && id !== null) {
        const existing = this.rootElement.querySelector<HTMLElement>(
          `[data-message-id="${String(id)}"]`,
        );
        if (existing) {
          existing.replaceWith(el);
          return;
        }
      }

      this.rootElement.appendChild(el);
    };

    Promise.resolve().then(insertOrReplace);

    return el;
  }

  private stripQuery(url: string): string {
    const q = url.indexOf('?');
    const h = url.indexOf('#');

    if (q === -1 && h === -1) return url;

    const cut =
      q === -1 ? h :
      h === -1 ? q :
      Math.min(q, h);

    return url.slice(0, cut);
  }
  
  private getHashName(url: string): string {
    const i = url.indexOf('#');
    if (i === -1) return '';
    try {
      return decodeURIComponent(url.slice(i + 1));
    } catch {
      return url.slice(i + 1);
    }
  }

  private isImageUrl(url: string): boolean {
    const hashName = this.getHashName(url).toLowerCase();
    if (hashName) return /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(hashName);

    const clean = this.stripQuery(url).toLowerCase();
    return /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(clean);
  }

  private extractName(url: string): string {
    const hashName = this.getHashName(url);
    if (hashName) return hashName;

    const clean = this.stripQuery(url);
    const last = clean.split('/').pop() || 'file';
    return last;
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
    const matches = Array.from(t.matchAll(regex))
      .map((m) => m[0])
      .filter((x): x is string => typeof x === 'string');
    return matches.length === 1 && matches[0] === t;
  }
}
