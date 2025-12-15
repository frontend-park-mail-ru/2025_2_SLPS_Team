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

interface ChatMessagesResponseAuthor {
  fullName: string;
  avatarPath?: string | null;
}

interface ChatMessagesResponseMessage {
  id: number;
  text: string;
  createdAt: string;
  attachments?: unknown;
  authorID: number;
}

interface ChatMessagesResponse {
  Messages?: ChatMessagesResponseMessage[];
  Authors?: Record<number, ChatMessagesResponseAuthor>;
  lastReadMessageId?: number | null;
  lastReadMessageID?: number | null;
}

interface SentMessageResponse {
  id: number;
  attachments?: unknown;
}

type WsNewMessagePayload = any;

function isRecord(v: unknown): v is Record<string, any> {
  return typeof v === 'object' && v !== null;
}

function normalizeAttachments(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    const out: string[] = [];
    for (const item of raw) {
      if (typeof item === 'string' && item.length) out.push(item);
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
        if (typeof url === 'string' && url.length) out.push(url);
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
    return typeof url === 'string' && url.length ? [url] : [];
  }
  return [];
}

function buildLocalAttachmentUrls(files: File[]): { urls: string[]; revoke: () => void } {
  const created: string[] = [];
  const urls = files.map((f) => {
    const base = URL.createObjectURL(f);
    created.push(base);

    if (f.type?.startsWith('image/') && f.name) {
      return `${base}#${encodeURIComponent(f.name)}`;
    }
    return base;
  });

  return {
    urls,
    revoke: () => created.forEach((u) => URL.revokeObjectURL(u)),
  };
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
  private scrollButton: HTMLButtonElement | null = null;

  private attachmentsModal: MessageAttachmentsModal | null = null;

  private lastReadMessageId: number | null;
  private unreadMessageIds: Set<number> = new Set();
  private readUpdateInFlight = false;

  private wsService: any;
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

      const authorId: number | null =
        last.authorID ??
        last.authorId ??
        last.userId ??
        last.userID ??
        last.user_id ??
        null;

      if (authorId === this.myUserId) return;

      if (this.messages.some((m) => m.id === msgId)) return;

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
        msg.render();
      }

      this.unreadMessageIds.add(view.id);
      this.lastReadMessageId = view.id;
      void this.pushReadState();

      EventBus.emit('chatReadUpdated', {
        chatId: this.chatInfo,
        unreadCount: this.unreadMessageIds.size,
        lastReadMessageId: this.lastReadMessageId,
      });

      this.scrollToBottom();
    };

    this.wsService.on?.('new_message', this.wsHandler);

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

    const rawData = (await getChatMessages(this.chatInfo, 1)) as ChatMessagesResponse;

    this.lastReadMessageId =
      rawData.lastReadMessageId ??
      (rawData as any).lastReadMessageID ??
      this.lastReadMessageId ??
      null;

    const rawMessages = (rawData.Messages ?? [])
      .slice()
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const authors: Record<number, ChatMessagesResponseAuthor> = rawData.Authors ?? {};

    this.messages = rawMessages.map<ChatMessageView>((msg: any) => {
      const author = authors?.[msg.authorID] ?? null;
      return {
        id: msg.id,
        text: msg.text ?? '',
        created_at: msg.createdAt ?? msg.created_at ?? new Date().toISOString(),
        attachments: normalizeAttachments(msg.attachments),
        User: {
          id: msg.authorID ?? -1,
          full_name: author?.fullName ?? 'User',
          avatar: author?.avatarPath ?? '',
        },
      };
    });

    this.messagesContainer.innerHTML = '';
    this.messages.forEach((m, idx) => {
      const isMine = m.User.id === this.myUserId;
      const isLastInGroup = idx === this.messages.length - 1;
      const msg = new Message(this.messagesContainer as HTMLElement, m as any, isMine, isLastInGroup, true);
      msg.render();
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

    if (this.inputMes.textarea) {
      this.inputMes.textarea.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          void this.sendEvent(e);
        }
      });
    }

    if (this.inputMes.sendButton) {
      this.inputMes.sendButton.addEventListener('click', (e: MouseEvent) => {
        void this.sendEvent(e);
      });
    }

    this.addScrollButton();
    this.restoreScrollPosition();
  }

  private async fetchMessageById(messageId: number): Promise<ChatMessageView | null> {
    if (!messageId) return null;
    try {
      const rawData = (await getChatMessages(this.chatInfo, 1)) as ChatMessagesResponse;
      const authors: Record<number, ChatMessagesResponseAuthor> = rawData.Authors ?? {};
      const found = (rawData.Messages ?? []).find((m) => m.id === messageId);
      if (!found) return null;

      const author = authors?.[found.authorID] ?? null;
      return {
        id: found.id,
        text: found.text ?? '',
        created_at: found.createdAt ?? new Date().toISOString(),
        attachments: normalizeAttachments(found.attachments),
        User: {
          id: found.authorID ?? -1,
          full_name: author?.fullName ?? 'User',
          avatar: author?.avatarPath ?? '',
        },
      };
    } catch {
      return null;
    }
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
  }

  private async sendEvent(e: Event): Promise<void> {
    e.preventDefault();

    const input = this.inputMes;
    const container = this.messagesContainer;
    if (!input || !container) return;

    const text = input.getValue().trim();
    const files =
      (input as unknown as { getFiles?: () => File[] }).getFiles?.() ?? [];

    if (!text && files.length === 0) return;

    const chatID = this.chatInfo;

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

      const optimisticMsg = new Message(container, optimistic as any, true, true, true);
      optimisticMsg.render();
      this.messages.push(optimistic);

      input.clear();

      this.scrollToBottom();

      try {
        const data = (await sendChatMessage(chatID, text, confirmedFiles)) as SentMessageResponse;

        const serverId = data?.id;
        const fromSend = normalizeAttachments((data as any)?.attachments);
        const hydrated = await this.fetchMessageById(serverId);

        const bestAttachments =
          (hydrated?.attachments && hydrated.attachments.length > 0)
            ? hydrated.attachments
            : (fromSend.length > 0 ? fromSend : local.urls);

        const final: ChatMessageView = {
          id: serverId,
          text,
          created_at: hydrated?.created_at ?? new Date().toISOString(),
          attachments: bestAttachments,
          User: optimistic.User,
        };

        this.replaceMessageInDom(optimisticId, final);

        const idx = this.messages.findIndex((m) => m.id === optimisticId);
        if (idx !== -1) this.messages[idx] = final;

        if (bestAttachments !== local.urls) {
          local.revoke();
        }

        EventBus.emit('chatUpdated', { chatId: this.chatInfo });

        this.lastReadMessageId = final.id;
        this.unreadMessageIds.clear();
        void this.pushReadState();

        EventBus.emit('chatReadUpdated', {
          chatId: this.chatInfo,
          unreadCount: 0,
          lastReadMessageId: this.lastReadMessageId,
        });

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

  private restoreScrollPosition(): void {
    if (!this.messagesContainer) return;

    if (!this.lastReadMessageId) {
      this.scrollToBottom();
      return;
    }

    const el = this.messagesContainer.querySelector<HTMLElement>(
      `[data-message-id="${this.lastReadMessageId}"]`,
    );

    if (!el) {
      this.scrollToBottom();
      return;
    }

    const targetTop = el.offsetTop - this.messagesContainer.clientHeight * 0.3;
    this.messagesContainer.scrollTop = Math.max(targetTop, 0);
  }

  private addScrollButton(): void {
    if (!this.messagesContainer) return;

    this.scrollButton = this.messagesContainer.querySelector<HTMLButtonElement>(
      '.scroll-to-bottom-btn',
    );
    if (!this.scrollButton) return;

    this.messagesContainer.addEventListener('scroll', () => {
      if (!this.messagesContainer || !this.scrollButton) return;

      const diff =
        this.messagesContainer.scrollHeight -
        (this.messagesContainer.scrollTop + this.messagesContainer.clientHeight);

      if (diff > 250) this.scrollButton.classList.add('visible');
      else this.scrollButton.classList.remove('visible');
    });

    this.scrollButton.addEventListener('click', () => this.scrollToBottom());
  }

  destroy(): void {
    if (this.wsHandler) {
      this.wsService.off?.('new_message', this.wsHandler);
      this.wsHandler = null;
    }
  }

  async loadSocet(): Promise<void> {
    const module = await import('services/WebSocketService');
    this.wsService = (module as any).wsService;
  }

  public getChatId(): number | undefined {
    return this.chatInfo;
  }
}
