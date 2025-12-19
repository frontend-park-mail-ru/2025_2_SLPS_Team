import ChatTemplate from './Chat.hbs';
import { ChatHeader } from '../../molecules/ChatHeader/ChatHeader';
import { MessageAttachmentsModal } from '../MessageAttachmentsModal/MessageAttachmentsModal';
import { Message } from '../../atoms/Message/Message';
import { MessageInput } from '../../molecules/MessageInput/MessageInput';
import { EventBus } from '../../../services/EventBus';

import {
  getChatMessages,
  sendChatMessage,
  updateChatReadState,
} from '../../../shared/api/chatsApi';

interface ChatUserView {
  id: number;
  full_name: string;
  avatar: string;
}

interface ChatMessageView {
  id: number;
  text: string;
  created_at: string;
  attachments?: string[];
  User: ChatUserView;
}

interface ChatData {
  id: number;
  name?: string | null;
  avatarPath?: string | null;
  lastReadMessageId?: number | null;
  lastReadMessageID?: number | null;
}

interface ChatOptions {
  hasBackButton?: boolean;
  onBack?: () => void;
}

type WsNewMessagePayload = any;

type StickerSelectPayload = {
  id: number;
  filePath: string;
};

const API_ORIGIN = (process.env.API_BASE_URL ?? '').replace(/\/$/, '');
const UPLOADS_BASE = `${API_ORIGIN}/uploads/`;

function isRecord(v: unknown): v is Record<string, any> {
  return typeof v === 'object' && v !== null;
}

function toAbsoluteAttachmentUrl(u: string): string {
  const s = (u ?? '').trim();
  if (!s) return s;

  if (s.startsWith('blob:')) return s;
  if (s.startsWith('http://') || s.startsWith('https://')) return s;

  if (s.startsWith('/uploads/') || s.startsWith('/api/uploads/')) {
    return `${API_ORIGIN}${s}`;
  }

  if (s.startsWith('/')) return `${location.origin}${s}`;

  return `${UPLOADS_BASE}${s}`;
}

function normalizeAttachments(raw: unknown): string[] {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    const out: string[] = [];
    for (const item of raw) {
      if (typeof item === 'string') out.push(toAbsoluteAttachmentUrl(item));
      else if (isRecord(item)) {
        const url =
          item.url ??
          item.path ??
          item.fileUrl ??
          item.file_url ??
          item.downloadUrl ??
          item.download_url ??
          item.src ??
          item.href;
        if (typeof url === 'string') out.push(toAbsoluteAttachmentUrl(url));
      }
    }
    return out;
  }

  if (isRecord(raw)) {
    const url =
      raw.url ??
      raw.path ??
      raw.fileUrl ??
      raw.file_url ??
      raw.downloadUrl ??
      raw.download_url ??
      raw.src ??
      raw.href;
    return typeof url === 'string' ? [toAbsoluteAttachmentUrl(url)] : [];
  }

  return [];
}

function extractStickerUrl(m: any): string {
  const p =
    m?.sticker?.filePath ??
    m?.sticker?.file_path ??
    m?.stickerPath ??
    m?.sticker_filePath ??
    m?.sticker_file_path;

  return typeof p === 'string' && p.length ? toAbsoluteAttachmentUrl(p) : '';
}

function extractStickerId(m: any): number | null {
  const id =
    m?.stickerID ??
    m?.stickerId ??
    m?.sticker_id ??
    m?.StickerID ??
    m?.StickerId ??
    m?.Sticker_id;

  return typeof id === 'number' ? id : null;
}

function mergeAttachmentsWithSticker(rawAttachments: unknown, rawMessage: any): string[] {
  const atts = normalizeAttachments(rawAttachments);
  const stickerUrl = extractStickerUrl(rawMessage);
  if (stickerUrl) atts.unshift(stickerUrl);
  return atts;
}

function buildLocalAttachmentUrls(files: File[]) {
  const created: string[] = [];
  const urls = files.map((f) => {
    const blob = URL.createObjectURL(f);
    created.push(blob);
    return f.name ? `${blob}#${encodeURIComponent(f.name)}` : blob;
  });
  return {
    urls,
    revoke: () => created.forEach(URL.revokeObjectURL),
  };
}

export class Chat {
  private rootElement: HTMLElement;
  private chatId: number;

  private stickerUrlById = new Map<number, string>();
  private stickersLoaded = false;

  private myUserId: number;
  private myUserName: string;
  private myUserAvatar: string;

  private data: ChatData;
  private hasBackButton: boolean;
  private onBack: (() => void) | null;

  private messages: ChatMessageView[] = [];
  private messagesContainer!: HTMLElement;
  private input!: MessageInput;
  private chatHeader!: ChatHeader;

  private attachmentsModal: MessageAttachmentsModal | null = null;

  private lastReadMessageId: number | null = null;
  private wsService: any;
  private wsHandler: ((data: WsNewMessagePayload) => void) | null = null;

  private page = 1;
  private totalPages: number | null = null;
  private isLoadingMore = false;
  private reachedEnd = false;

  private onScrollBound = () => this.onScroll();

  constructor(
    rootElement: HTMLElement,
    myUserId: number,
    myUserName: string,
    myUserAvatar: string,
    data: ChatData,
    options: ChatOptions = {},
  ) {
    this.rootElement = rootElement;
    this.chatId = data.id;

    this.myUserId = myUserId;
    this.myUserName = myUserName;
    this.myUserAvatar = myUserAvatar;

    this.data = data;
    this.hasBackButton = options.hasBackButton ?? false;
    this.onBack = options.onBack ?? null;

    this.lastReadMessageId =
      data.lastReadMessageId ?? (data as any).lastReadMessageID ?? null;
  }

  private async ensureStickersLoaded(): Promise<void> {
    if (this.stickersLoaded) return;
    this.stickersLoaded = true;

    try {
      const mod = await import('../../../shared/api/stickersApi');
      const packs = await (mod as any).getStickerPacks();

      for (const p of packs) {
        const stickers = await (mod as any).getPackStickers(p.id);
        for (const s of stickers) {
          this.stickerUrlById.set(s.id, toAbsoluteAttachmentUrl(s.filePath));
        }
      }
    } catch {
      this.stickersLoaded = false;
    }
  }

  private mapMessage(m: any, authorFallback?: number): ChatMessageView {
    const atts = mergeAttachmentsWithSticker(m?.attachments, m);

    if (atts.length === 0) {
      const sid = extractStickerId(m);
      if (sid !== null) {
        const url = this.stickerUrlById.get(sid);
        if (url) atts.unshift(url);
      }
    }

    return {
      id: m.id,
      text: m.text ?? '',
      created_at: m.createdAt ?? m.created_at ?? new Date().toISOString(),
      attachments: atts,
      User: {
        id: m.authorID ?? authorFallback ?? 0,
        full_name: 'User',
        avatar: '',
      },
    };
  }

  private isSyncingAfterWs = false;

  private async syncMessageFromApi(messageId: number) {
    if (this.isSyncingAfterWs) return;
    this.isSyncingAfterWs = true;

    try {
      await this.ensureStickersLoaded();

      const raw: any = await getChatMessages(this.chatId, 0);
      const list = raw?.messages ?? raw?.Messages ?? [];

      const found = (list as any[]).find((m) => m.id === messageId);
      if (!found) return;

      if (this.messages.some((m) => m.id === messageId)) return;

      const view = this.mapMessage(found, found.authorID);

      this.messages.push(view);
      new Message(this.messagesContainer, view as any, false, true, true).render();
      this.scrollToBottomSoon();
    } finally {
      this.isSyncingAfterWs = false;
    }
  }

  async render(): Promise<void> {
    await this.loadSocket();

    const wrapper = document.createElement('div');
    wrapper.innerHTML = ChatTemplate(this.chatId);

    const main = wrapper.querySelector('.chat-container') as HTMLElement;
    this.rootElement.innerHTML = '';
    this.rootElement.appendChild(main);

    this.messagesContainer = main.querySelector('.chat-messeges') as HTMLElement;
    const inputContainer = main.querySelector('.messege-input') as HTMLElement;
    const headerContainer = main.querySelector('.chat-header-container') as HTMLElement;

    this.chatHeader = new ChatHeader(
      headerContainer,
      this.data.name ?? '',
      this.data.avatarPath ?? '',
      this.hasBackButton,
      this.onBack ?? undefined,
    );
    this.chatHeader.render();

    this.input = new MessageInput(inputContainer);
    this.input.render();

    await this.ensureStickersLoaded();

    this.input.onStickerSelect = (sticker: StickerSelectPayload) => {
      void this.sendSticker(sticker);
    };

    this.input.textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) this.sendEvent(e);
    });

    this.input.sendButton.addEventListener('click', (e) => {
      this.sendEvent(e);
    });

    this.page = 1;
    this.reachedEnd = false;

    const raw = await getChatMessages(this.chatId, 1);

    this.totalPages =
      (raw as any).totalPages ??
      (raw as any).total_pages ??
      (raw as any).TotalPages ??
      null;

    const list = (raw as any).messages ?? (raw as any).Messages ?? [];

    this.messages = list.map((m: any) => this.mapMessage(m));

    this.messages.sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );

    this.messagesContainer.innerHTML = '';
    this.messages.forEach((m, i) => {
      new Message(
        this.messagesContainer,
        m as any,
        m.User.id === this.myUserId,
        i === this.messages.length - 1,
        false,
      ).render();
    });

    this.scrollToBottomSoon();
    this.messagesContainer.removeEventListener('scroll', this.onScrollBound);
    this.messagesContainer.addEventListener('scroll', this.onScrollBound, { passive: true });
    this.initWS();
  }

  private async sendSticker(sticker: StickerSelectPayload): Promise<void> {
    this.input.clear();

    const optimisticId = -Date.now();
    const stickerUrl = toAbsoluteAttachmentUrl(sticker.filePath);

    const optimistic: ChatMessageView = {
      id: optimisticId,
      text: '',
      created_at: new Date().toISOString(),
      attachments: stickerUrl ? [stickerUrl] : [],
      User: {
        id: this.myUserId,
        full_name: this.myUserName,
        avatar: this.myUserAvatar,
      },
    };

    new Message(this.messagesContainer, optimistic as any, true, true, true).render();
    this.messages.push(optimistic);
    this.scrollToBottomSoon();

    try {
      const resp: any = await sendChatMessage(this.chatId, '', [], sticker.id);

      const serverId = resp?.messageID ?? resp?.messageId ?? resp?.id;

      const final: ChatMessageView = {
        ...optimistic,
        id: typeof serverId === 'number' ? serverId : optimisticId,
      };

      this.replaceMessage(optimisticId, final);
      this.replaceMessageInState(optimisticId, final);

      if (typeof serverId === 'number') {
        this.lastReadMessageId = serverId;
        await updateChatReadState(this.chatId, serverId);
      }

      EventBus.emit('chatUpdated', { chatId: this.chatId });
    } catch (e) {
      console.error('sendSticker error', e);
    }
  }

  private async sendEvent(e: Event): Promise<void> {
    e.preventDefault();

    const text = this.input.getValue().trim();
    const files = this.input.getFiles();

    if (!text && files.length === 0) return;

    const optimisticId = -Date.now();
    const local = buildLocalAttachmentUrls(files);

    const optimistic: ChatMessageView = {
      id: optimisticId,
      text,
      created_at: new Date().toISOString(),
      attachments: local.urls,
      User: {
        id: this.myUserId,
        full_name: this.myUserName,
        avatar: this.myUserAvatar,
      },
    };

    new Message(this.messagesContainer, optimistic as any, true, true, true).render();
    this.messages.push(optimistic);

    this.input.clear();
    this.scrollToBottomSoon();

    try {
      const resp: any = await sendChatMessage(this.chatId, text, files);
      const serverAttachments = mergeAttachmentsWithSticker(resp.attachments, resp);

      const final: ChatMessageView = {
        id: resp.id,
        text,
        created_at: resp.createdAt ?? resp.created_at ?? new Date().toISOString(),
        attachments: serverAttachments.length ? serverAttachments : local.urls,
        User: optimistic.User,
      };

      this.replaceMessage(optimisticId, final);
      this.replaceMessageInState(optimisticId, final);
      local.revoke();

      this.lastReadMessageId = final.id;
      await updateChatReadState(this.chatId, final.id);

      EventBus.emit('chatUpdated', { chatId: this.chatId });
    } catch {
      local.revoke();
    }
  }

  private replaceMessage(oldId: number, next: ChatMessageView) {
    const el = this.messagesContainer.querySelector(
      `[data-message-id="${oldId}"]`,
    );
    const msg = new Message(this.messagesContainer, next as any, true, true, false);
    const newEl = msg.render();
    if (el && newEl) el.replaceWith(newEl);
  }

  private replaceMessageInState(oldId: number, next: ChatMessageView) {
    const idx = this.messages.findIndex((m) => m.id === oldId);
    if (idx >= 0) this.messages[idx] = next;
  }

  private scrollToBottomSoon() {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
      });
    });
  }

  private onScroll() {
    if (this.messagesContainer.scrollTop > 80) return;
    void this.loadMore();
  }

  private async loadMore() {
    if (this.isLoadingMore || this.reachedEnd) return;

    if (this.totalPages !== null && this.page >= this.totalPages) {
      this.reachedEnd = true;
      return;
    }

    this.isLoadingMore = true;
    const nextPage = this.page + 1;

    const prevScrollHeight = this.messagesContainer.scrollHeight;
    const prevScrollTop = this.messagesContainer.scrollTop;

    try {
      const raw = await getChatMessages(this.chatId, nextPage);

      const newTotalPages =
        (raw as any).totalPages ??
        (raw as any).total_pages ??
        (raw as any).TotalPages ??
        null;

      if (newTotalPages !== null) this.totalPages = newTotalPages;

      const list = (raw as any).messages ?? (raw as any).Messages ?? [];
      if (!Array.isArray(list) || list.length === 0) {
        this.reachedEnd = true;
        return;
      }

      const batch: ChatMessageView[] = list.map((m: any) => this.mapMessage(m));

      batch.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );

      const existing = new Set(this.messages.map((m) => m.id));
      const uniqueBatch = batch.filter((m) => !existing.has(m.id));

      this.page = nextPage;

      if (uniqueBatch.length === 0) return;

      this.messages = [...uniqueBatch, ...this.messages];

      const frag = document.createDocumentFragment();
      for (const m of uniqueBatch) {
        const msg = new Message(
          this.messagesContainer,
          m as any,
          m.User.id === this.myUserId,
          false,
          false,
        );
        const el = msg.render();
        if (el) frag.appendChild(el);
      }

      this.messagesContainer.insertBefore(frag, this.messagesContainer.firstChild);

      const newScrollHeight = this.messagesContainer.scrollHeight;
      this.messagesContainer.scrollTop = prevScrollTop + (newScrollHeight - prevScrollHeight);
    } finally {
      this.isLoadingMore = false;
    }
  }

  private initWS() {
    if (this.wsHandler) {
      try {
        this.wsService.off?.('new_message', this.wsHandler);
      } catch {}
    }

    this.wsHandler = (data: any) => {
      const msg = data?.lastMessage;
      if (!msg) return;

      const chatId = msg.chatID ?? msg.chatId;
      if (chatId !== this.chatId) return;

      const authorId = msg.authorID ?? msg.authorId;
      if (authorId === this.myUserId) return;

      void this.ensureStickersLoaded();

      const stickerUrl = extractStickerUrl(msg);

      const hasAttachments =
        Array.isArray(msg.attachments) ? msg.attachments.length > 0 : !!msg.attachments;

      const hasAnyMedia = hasAttachments || !!stickerUrl || extractStickerId(msg) !== null;

      if (!hasAnyMedia) {
        void this.syncMessageFromApi(msg.id);
        return;
      }

      const view = this.mapMessage(msg, authorId);
      view.User = {
        id: authorId,
        full_name: data?.lastMessageAuthor?.fullName ?? 'User',
        avatar: data?.lastMessageAuthor?.avatarPath ?? '',
      };

      this.messages.push(view);
      new Message(this.messagesContainer, view as any, false, true, true).render();
      this.scrollToBottomSoon();
    };

    this.wsService.on('new_message', this.wsHandler);
  }

  async loadSocket() {
    const mod = await import('services/WebSocketService');
    this.wsService = (mod as any).wsService;
  }

  public getChatId(): number {
    return this.chatId;
  }
}
