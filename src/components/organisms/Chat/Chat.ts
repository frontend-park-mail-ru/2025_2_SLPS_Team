import ChatTemplate from './Chat.hbs';
import { ChatHeader } from '../../molecules/ChatHeader/ChatHeader';
import { MessageAttachmentsModal } from '../MessageAttachmentsModal/MessageAttachmentsModal';
import { Message } from '../../atoms/Message/Message';
import { MessageInput } from '../../molecules/MessageInput/MessageInput';
import { EventBus } from '../../../services/EventBus';

import { getChatMessages, sendChatMessage, updateChatReadState } from '../../../shared/api/chatsApi';

export interface ChatData {
  id: number;
  avatarPath: string;
  name: string;
}

type ChatOptions = {
  hasBackButton?: boolean;
  onBack?: () => void;
  initialLastReadMessageId?: number | null;
};

type ChatUserView = {
  id: number;
  full_name: string;
  avatar: string;
};

export type ChatMessageView = {
  id: number;
  text: string;
  created_at: string;
  attachments?: string[];
  User: ChatUserView;
};

type SentMessageResponse = {
  id: number;
  attachments?: string[];
};

type WsMessagePacket = { Data?: unknown } & Record<string, unknown>;

export class Chat {
  rootElement: HTMLElement;

  private wrapper: HTMLElement | null = null;
  private messagesContainer: HTMLElement | null = null;

  private chatInfo: number;
  private data: ChatData;

  private messages: ChatMessageView[] = [];

  private lastReadMessageId: number | null = null;

  private myUserId: number;
  private myUserName: string;
  private myUserAvatar: string;

  private chatHeader: ChatHeader | null = null;
  private inputMes: MessageInput | null = null;

  private attachmentsModal: MessageAttachmentsModal | null = null;

  private hasBackButton: boolean;
  private onBack: (() => void) | null;

  private wsService: any = null;
  private wsHandler: ((packet: WsMessagePacket) => void) | null = null;

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
    this.data = data;

    this.myUserId = myUserId;
    this.myUserName = myUserName;
    this.myUserAvatar = myUserAvatar;

    this.hasBackButton = options.hasBackButton ?? false;
    this.onBack = options.onBack ?? null;

    if (typeof options.initialLastReadMessageId === 'number') {
      this.lastReadMessageId = options.initialLastReadMessageId;
    }
  }

  async render(): Promise<void> {
    const wrap = document.createElement('div');
    wrap.innerHTML = ChatTemplate(this.chatInfo);

    const mainContainer = wrap.querySelector<HTMLDivElement>('.chat-container');
    if (!mainContainer) throw new Error('Chat:.chat-container not found');

    this.wrapper = mainContainer;

    const messagesContainer = mainContainer.querySelector('.messages-container') as HTMLElement | null;
    if (!messagesContainer) throw new Error('Chat:.messages-container not found');
    this.messagesContainer = messagesContainer;

    const headerContainer = mainContainer.querySelector<HTMLDivElement>('.chat-header-container');
    if (!headerContainer) throw new Error('Chat:.chat-header-container not found');

    this.chatHeader = new ChatHeader(
      headerContainer,
      this.data.name,
      this.data.avatarPath ?? '',
      this.hasBackButton,
      this.onBack ?? undefined,
    );
    this.chatHeader.render();

    const inputContainer = mainContainer.querySelector<HTMLDivElement>('.messege-input');
    if (!inputContainer) throw new Error('Chat:.messege-input not found');

    this.inputMes = new MessageInput(inputContainer, async ({ text, files }) => {
      await this.sendMessage(text, files);
    });
    this.inputMes.render();

    await this.loadSocet();
    this.attachWs();

    await this.loadMessages();

    this.rootElement.appendChild(mainContainer);
    this.scrollToBottom();
  }

  private normalizeMessages(raw: any): { messages: ChatMessageView[]; lastReadMessageId: number | null } {
    const lastRead = typeof raw?.lastReadMessageId === 'number' ? raw.lastReadMessageId : null;

    const list: any[] = Array.isArray(raw?.messages) ? raw.messages : [];

    const mapped: ChatMessageView[] = list.map((m: any) => {
      const id = Number(m?.id ?? 0);
      const text = typeof m?.text === 'string' ? m.text : '';
      const created_at = (m?.createdAt ?? m?.created_at ?? new Date().toISOString()) as string;

      const attachments: string[] = Array.isArray(m?.attachments)
        ? m.attachments.filter((x: any) => typeof x === 'string')
        : [];

      const authorName =
        m?.author?.fullName ??
        m?.User?.full_name ??
        m?.user?.full_name ??
        '';

      const authorAvatar =
        m?.author?.avatarPath ??
        m?.User?.avatar ??
        m?.user?.avatar ??
        '';

      return {
        id,
        text,
        created_at,
        attachments,
        User: {
          id: Number(m?.User?.id ?? m?.user?.id ?? 0),
          full_name: String(authorName),
          avatar: String(authorAvatar),
        },
      };
    });

    return { messages: mapped, lastReadMessageId: lastRead };
  }

  private async loadMessages(): Promise<void> {
    if (!this.messagesContainer) return;

    const raw = await getChatMessages(this.chatInfo);
    const normalized = this.normalizeMessages(raw);

    if (normalized.lastReadMessageId !== null) {
      this.lastReadMessageId = normalized.lastReadMessageId;
    }

    this.messages = normalized.messages;

    this.messagesContainer.innerHTML = '';

    this.messages.forEach((message) => {
      const isMine = message.User.full_name === this.myUserName;
      const msg = new Message(this.messagesContainer!, message as any, isMine, true, false);
      const el = msg.render();
      if (el) this.messagesContainer!.appendChild(el);
    });
  }

  private attachWs(): void {
    if (!this.wsService || this.wsHandler) return;

    this.wsHandler = (packet: WsMessagePacket) => {
      const raw = (packet?.Data ?? packet) as any;

      const chatId = raw?.chatId ?? raw?.id;
      if (typeof chatId !== 'number' || chatId !== this.chatInfo) return;

      const last = raw?.lastMessage ?? raw?.last_message;
      const author = raw?.lastMessageAuthor ?? raw?.last_message_author ?? raw?.author;

      if (!last) return;

      const messageData: ChatMessageView = {
        id: Number(last?.id ?? 0),
        text: String(last?.text ?? ''),
        created_at: String(last?.createdAt ?? new Date().toISOString()),
        attachments: Array.isArray(last?.attachments) ? last.attachments : [],
        User: {
          id: 0,
          full_name: String(author?.fullName ?? ''),
          avatar: String(author?.avatarPath ?? ''),
        },
      };

      if (this.messages.some((m) => m.id === messageData.id)) return;

      const isMine = messageData.User.full_name === this.myUserName;

      const msg = new Message(this.messagesContainer!, messageData as any, isMine, true, true);
      const el = msg.render();
      if (el) this.messagesContainer!.appendChild(el);

      this.messages.push(messageData);

      if (isMine) {
        this.lastReadMessageId = messageData.id;
        void this.pushReadState();
      }

      this.scrollToBottom();
    };

    this.wsService.on?.('new_message', this.wsHandler);
  }

  private async sendMessage(textRaw: string, filesRaw: File[]): Promise<void> {
    const container = this.messagesContainer;
    if (!container) return;

    const text = (textRaw || '').trim();
    const files = Array.isArray(filesRaw) ? filesRaw : [];

    if (!text && files.length === 0) return;

    const doSend = async (confirmedFiles: File[]) => {
      const data = (await sendChatMessage(this.chatInfo, text, confirmedFiles)) as SentMessageResponse;

      const message: ChatMessageView = {
        id: data.id,
        text,
        created_at: new Date().toISOString(),
        attachments: data.attachments ?? [],
        User: {
          id: this.myUserId,
          full_name: this.myUserName,
          avatar: this.myUserAvatar,
        },
      };

      const msg = new Message(container, message as any, true, true, true);
      const el = msg.render();
      if (el) container.appendChild(el);

      this.messages.push(message);

      EventBus.emit('chatUpdated', { chatId: this.chatInfo });

      this.lastReadMessageId = message.id;
      void this.pushReadState();

      EventBus.emit('chatReadUpdated', {
        chatId: this.chatInfo,
        unreadCount: 0,
        lastReadMessageId: this.lastReadMessageId,
      });

      this.scrollToBottom();
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
    try {
      await updateChatReadState(this.chatInfo, this.lastReadMessageId);
    } catch (e) {
      console.error('Не удалось обновить lastReadMessageId', e);
    }
  }

  private scrollToBottom(): void {
    if (!this.messagesContainer) return;
    this.messagesContainer.scrollTop =
      this.messagesContainer.scrollHeight - this.messagesContainer.clientHeight;
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
