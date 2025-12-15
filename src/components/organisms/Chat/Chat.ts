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

function isRecord(v: unknown): v is Record<string, any> {
  return typeof v === 'object' && v !== null;
}
const API_BASE_URL = (process.env.API_BASE_URL ?? '').replace(/\/+$/, '');
const UPLOADS_BASE = API_BASE_URL ? `${API_BASE_URL}/uploads/` : '/uploads/';

function resolveAttachmentUrl(raw: string): string {
  if (!raw) return '';
  if (/^(https?:|blob:|data:)/i.test(raw)) return raw;

  if (raw.startsWith('/')) return raw;

  if (raw.startsWith('uploads/')) return UPLOADS_BASE + raw.slice('uploads/'.length);
  if (raw.startsWith('api/')) return `${API_BASE_URL}/${raw}`;

  return UPLOADS_BASE + raw;
}

function withNameHint(url: string, name?: string): string {
  if (!url) return url;
  if (!name) return url;

   const clean = (url.split('?')[0] ?? '').toLowerCase();
  if (/\.(png|jpe?g|gif|webp|bmp|svg)$/.test(clean)) return url;

  return `${url}#${encodeURIComponent(name)}`;
}

function normalizeAttachments(raw: unknown): string[] {
  if (!raw) return [];

  const out: string[] = [];

  const pushOne = (urlAny: unknown, nameAny?: unknown) => {
    if (typeof urlAny !== 'string' || !urlAny.length) return;

    const url = resolveAttachmentUrl(urlAny);

    const name =
      typeof nameAny === 'string'
        ? nameAny
        : undefined;

    out.push(withNameHint(url, name));
  };

  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (typeof item === 'string') {
        pushOne(item);
      } else if (item && typeof item === 'object') {
        const r = item as any;
        pushOne(
          r.url ?? r.path ?? r.fileUrl ?? r.file_url ?? r.downloadUrl ?? r.download_url ?? r.src ?? r.href,
          r.name ?? r.fileName ?? r.filename ?? r.originalName ?? r.original_name ?? r.file_name,
        );
      }
    }
    return out.filter(Boolean);
  }

  if (raw && typeof raw === 'object') {
    const r = raw as any;
    pushOne(
      r.url ?? r.path ?? r.fileUrl ?? r.file_url ?? r.downloadUrl ?? r.download_url ?? r.src ?? r.href,
      r.name ?? r.fileName ?? r.filename ?? r.originalName ?? r.original_name ?? r.file_name,
    );
    return out.filter(Boolean);
  }

  return [];
}


function buildLocalAttachmentUrls(files: File[]): { urls: string[]; revoke: () => void } {
  const created: string[] = [];
  const urls = files.map((f) => {
    const base = URL.createObjectURL(f);
    created.push(base);
    return f.name ? `${base}#${encodeURIComponent(f.name)}` : base;
  });
  return {
    urls,
    revoke: () => created.forEach((u) => URL.revokeObjectURL(u)),
  };
}

// вытаскиваем payload из любого формата api-клиента
function unwrapApiPayload<T = any>(resp: any): T {
  if (!resp) return resp;
  if (resp.message) return resp.message;
  if (resp.data) return resp.data;
  if (resp.result) return resp.result;
  return resp;
}

export class Chat {
  private rootElement: HTMLElement;
  private chatInfo: number;

  private myUserId: number;
  private myUserName: string;
  private myUserAvatar: string;

  private data: ChatData;

  private hasBackButton: boolean;
  private onBack: (() => void) | null;

  private messages: ChatMessageView[] = [];
  private chatHeader: ChatHeader | null = null;
  private inputMes: MessageInput | null = null;

  private messagesContainer: HTMLElement | null = null;

  private attachmentsModal: MessageAttachmentsModal | null = null;

  private lastReadMessageId: number | null;
  private unreadMessageIds: Set<number> = new Set();
  private readUpdateInFlight = false;

  private wsService: { on?: (event: string, cb: any) => void; off?: (event: string, cb: any) => void } | null = null;
  private wsHandler: ((data: WsNewMessagePayload | null) => void) | null = null;

  constructor(
    rootElement: HTMLElement,
    myUserId: number,
    myUserName: string,
    myUserAvatar: string,
    data: ChatData,
    options: ChatOptions = {},
  ) {
    this.rootElement = rootElement;
    this.chatInfo = data.id;

    this.myUserId = myUserId;
    this.myUserName = myUserName;
    this.myUserAvatar = myUserAvatar;

    this.data = data;

    this.hasBackButton = options.hasBackButton ?? false;
    this.onBack = options.onBack ?? null;

    this.lastReadMessageId =
      data.lastReadMessageId ?? (data as any).lastReadMessageID ?? null;
  }

  private appendNow(container: HTMLElement, msg: Message): void {
    const el = msg.render();
    if (el && !el.isConnected) container.appendChild(el);
  }

  async render(): Promise<void> {
    await this.loadSocet();

    this.wsHandler = (data: WsNewMessagePayload | null) => {
      if (!data) return;

      const chatIdFromEvent =
        data.id ??
        data.chatId ??
        data.chatID ??
        data.chat_id ??
        data.lastMessage?.chatID ??
        data.last_message?.chatID ??
        data.message?.chatID;

      if (chatIdFromEvent !== this.chatInfo) return;

      const last =
        data.lastMessage ??
        data.last_message ??
        data.message ??
        data.payload ??
        null;

      if (!last) return;

      const msgId: number | null =
        last.id ?? last.messageId ?? last.messageID ?? last.message_id ?? null;

      if (!msgId) return;
      if (this.messages.some((m) => m.id === msgId)) return;

      const authorId: number | null =
        last.authorID ?? last.authorId ?? last.userId ?? last.userID ?? last.user_id ?? null;

      const createdAt: string =
        last.createdAt ?? last.created_at ?? last.time ?? new Date().toISOString();

      const view: ChatMessageView = {
        id: msgId,
        text: String(last.text ?? last.message ?? ''),
        created_at: createdAt,
        attachments: normalizeAttachments(last.attachments),
        User: {
          id: typeof authorId === 'number' ? authorId : -1,
          full_name: last.fullName ?? last.userName ?? last.user_full_name ?? 'User',
          avatar: last.avatar ?? last.avatarPath ?? last.userAvatar ?? '',
        },
      };

      this.messages.push(view);

      if (this.messagesContainer) {
        const isMine = view.User.id === this.myUserId;
        const msg = new Message(this.messagesContainer, view as any, isMine, true, true);
        this.appendNow(this.messagesContainer, msg);
      }

      this.scrollToBottom();
    };

  this.wsService?.on?.('new_message', this.wsHandler);

    const wrapper = document.createElement('div');
    wrapper.innerHTML = ChatTemplate(this.chatInfo);

    const mainContainer = wrapper.querySelector<HTMLDivElement>('.chat-container');
    if (!mainContainer) throw new Error('Chat:.chat-container not found');

    this.rootElement.innerHTML = '';
    this.rootElement.appendChild(mainContainer);

    this.messagesContainer = mainContainer.querySelector<HTMLElement>('.chat-messeges');
    if (!this.messagesContainer) throw new Error('Chat:.chat-messeges not found');

    const inputContainer = mainContainer.querySelector<HTMLDivElement>('.messege-input');
    if (!inputContainer) throw new Error('Chat:.messege-input not found');

    const headerContainer =
      mainContainer.querySelector<HTMLDivElement>('.chat-header-container');
    if (!headerContainer) throw new Error('Chat:.chat-header-container not found');

    const raw = unwrapApiPayload<any>(await getChatMessages(this.chatInfo, 1));

    // поддерживаем оба формата: {Messages: []} и {messages: []}
    const rawMessages: any[] = (raw?.Messages ?? raw?.messages ?? []).slice();
    rawMessages.sort((a, b) => new Date(a.createdAt ?? a.created_at).getTime() - new Date(b.createdAt ?? b.created_at).getTime());

    this.messages = rawMessages.map((m: any) => ({
      id: m.id,
      text: m.text ?? '',
      created_at: m.createdAt ?? m.created_at ?? new Date().toISOString(),
      attachments: normalizeAttachments(m.attachments),
      User: {
        id: m.authorID ?? m.authorId ?? -1,
        full_name: m.authorName ?? m.fullName ?? 'User',
        avatar: m.avatarPath ?? '',
      },
    }));

    this.messagesContainer.innerHTML = '';
    this.messages.forEach((m, idx) => {
      const isMine = m.User.id === this.myUserId;
      const isLastInGroup = idx === this.messages.length - 1;
      const msg = new Message(this.messagesContainer as HTMLElement, m as any, isMine, isLastInGroup, true);
      this.appendNow(this.messagesContainer as HTMLElement, msg);
    });

    this.chatHeader = new ChatHeader(
      headerContainer,
      this.data.name ?? '',
      this.data.avatarPath ?? '',
      this.hasBackButton,
      this.onBack ?? undefined,
    );
    this.chatHeader.render();

    this.inputMes = new MessageInput(inputContainer);
    this.inputMes.render();

    this.inputMes.textarea?.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) void this.sendEvent(e);
    });

    this.inputMes.sendButton?.addEventListener('click', (e: MouseEvent) => {
      void this.sendEvent(e);
    });

    this.scrollToBottom();
  }

  private replaceMessageInDom(oldId: number, next: ChatMessageView): void {
    if (!this.messagesContainer) return;

    const oldEl = this.messagesContainer.querySelector<HTMLElement>(
      `[data-message-id="${String(oldId)}"]`,
    );

    const msg = new Message(this.messagesContainer, next as any, true, true, false);
    const newEl = msg.render();

    if (oldEl && newEl) {
      oldEl.replaceWith(newEl);
      return;
    }

    // если не нашли optimistic — просто добавим финальный
    if (newEl && !newEl.isConnected) this.messagesContainer.appendChild(newEl);
  }

  private async sendEvent(e: Event): Promise<void> {
    e.preventDefault();

    const input = this.inputMes;
    const container = this.messagesContainer;
    if (!input || !container) return;

    const text = input.getValue().trim();
    const files = input.getFiles?.() ?? [];

    if (!text && files.length === 0) return;

    const doSend = async (confirmedFiles: File[]) => {
      const optimisticId = -Date.now();
      const local = buildLocalAttachmentUrls(confirmedFiles);

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

      // ✅ показываем вложения сразу
      this.appendNow(container, new Message(container, optimistic as any, true, true, true));
      this.messages.push(optimistic);

      input.clear();
      this.scrollToBottom();

      try {
        const resp = unwrapApiPayload<any>(await sendChatMessage(this.chatInfo, text, confirmedFiles));

        const serverId: number = resp?.id ?? resp?.messageId ?? resp?.messageID;
        const serverAttachments = normalizeAttachments(resp?.attachments);

        const final: ChatMessageView = {
          id: serverId || optimisticId, // на всякий
          text,
          created_at: resp?.createdAt ?? resp?.created_at ?? new Date().toISOString(),
          attachments: serverAttachments.length ? serverAttachments : local.urls,
          User: optimistic.User,
        };

        if (serverId) {
          this.replaceMessageInDom(optimisticId, final);
          const idx = this.messages.findIndex((m) => m.id === optimisticId);
          if (idx !== -1) this.messages[idx] = final;
        }

        // если сервер дал нормальные урлы — можно освобождать blob
        if (serverAttachments.length) local.revoke();

        EventBus.emit('chatUpdated', { chatId: this.chatInfo });

        this.lastReadMessageId = final.id;
        this.unreadMessageIds.clear();
        void this.pushReadState();

        this.scrollToBottom();
      } catch {
        local.revoke();
      }
    };

    if (files.length > 0) {
      if (!this.attachmentsModal) this.attachmentsModal = new MessageAttachmentsModal();
      this.attachmentsModal.open(files, async (confirmedFiles) => {
        await doSend(confirmedFiles);
      });
      return;
    }

    await doSend([]);
  }

  private async pushReadState(): Promise<void> {
    if (!this.lastReadMessageId) return;
    if (this.readUpdateInFlight) return;

    this.readUpdateInFlight = true;
    try {
      await updateChatReadState(this.chatInfo, this.lastReadMessageId);
    } finally {
      this.readUpdateInFlight = false;
    }
  }

  private scrollToBottom(): void {
    if (!this.messagesContainer) return;
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  destroy(): void {
    if (this.wsHandler) {
      this.wsService?.off?.('new_message', this.wsHandler);
      this.wsHandler = null;
    }
  }

  async loadSocet(): Promise<void> {
    const module = await import('services/WebSocketService');
    this.wsService = ((module as any)?.wsService ?? null);
  }

  public getChatId(): number | undefined {
    return this.chatInfo;
  }
}
