import ChatTemplate from './Chat.hbs';
import { ChatHeader } from '../../molecules/ChatHeader/ChatHeader';
import { Message } from '../../atoms/Message/Message';
import { MessageInput } from '../../molecules/MessageInput/MessageInput';

import { wsService } from '../../../services/WebSocketService.js';
import { EventBus } from '../../../services/EventBus';

import {
  getChatMessages,
  sendChatMessage,
  updateChatReadState,
} from '../../../shared/api/chatsApi.js';

interface ChatUserView {
  id: number;
  full_name: string;
  avatar: string;
}

export interface ChatMessageView {
  id: number;
  text: string;
  created_at: string;
  User: ChatUserView;
}

interface ChatMessagesResponseAuthor {
  fullName: string;
  avatarPath?: string | null;
}

interface ChatMessagesResponseMessage {
  id: number;
  text: string;
  createdAt: string;
  authorID: number;
}

interface ChatMessagesResponse {
  Messages?: ChatMessagesResponseMessage[];
  Authors?: Record<number, ChatMessagesResponseAuthor>;
}

interface SentMessageResponse {
  id: number;
}

export interface ChatData {
  id: number;
  name: string;
  avatarPath?: string | null;
  lastReadMessageId?: number | null;
  lastReadMessageID?: number | null;
}

export interface ChatOptions {
  hasBackButton?: boolean;
  onBack?: () => void;
}

interface WsLastMessage {
  id: number;
  text: string;
  createdAt: string;
  chatID: number;
}

interface WsAuthor {
  userID: number;
  fullName: string;
  avatarPath?: string | null;
}

interface WsNewMessagePayload {
  id?: number;
  chatId?: number;
  chatID?: number;
  chat_id?: number;

  lastMessage?: WsLastMessage;
  last_message?: WsLastMessage;
  message?: WsLastMessage;

  lastMessageAuthor?: WsAuthor;
  last_message_author?: WsAuthor;
  author?: WsAuthor;
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
  private messagesContainer!: HTMLDivElement;
  private scrollButton: HTMLButtonElement | null = null;

  private lastReadMessageId: number | null;
  private unreadMessageIds: Set<number> = new Set();
  private readUpdateInFlight = false;

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
      data.lastReadMessageId ?? data.lastReadMessageID ?? null;
  }

  async render(): Promise<void> {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = ChatTemplate(this.chatInfo);

    const mainContainer = wrapper.querySelector<HTMLDivElement>('.chat-container');
    if (!mainContainer) {
      throw new Error('Chat: .chat-container not found');
    }

    const rawData = (await getChatMessages(
      this.chatInfo,
      1,
    )) as ChatMessagesResponse;

    const rawMessages: ChatMessagesResponseMessage[] = rawData.Messages ?? [];
    const authors: Record<number, ChatMessagesResponseAuthor> = rawData.Authors ?? {};

    this.messages = rawMessages.map<ChatMessageView>((msg) => {
      const author = authors[msg.authorID];
      return {
        id: msg.id,
        text: msg.text,
        created_at: msg.createdAt,
        User: {
          id: msg.authorID,
          full_name: author?.fullName ?? '',
          avatar: author?.avatarPath ?? '',
        },
      };
    });

    const headerContainer = mainContainer.querySelector<HTMLDivElement>(
      '.chat-header-container',
    );
    if (!headerContainer) {
      throw new Error('Chat: .chat-header-container not found');
    }

    this.chatHeader = new ChatHeader(
      headerContainer,
      this.data.name,
      this.data.avatarPath ?? '',
      this.hasBackButton,
      this.onBack ?? undefined,
    );
    this.chatHeader.render();

    const messagesContainer = mainContainer.querySelector<HTMLDivElement>(
      '.chat-messeges',
    );
    if (!messagesContainer) {
      throw new Error('Chat: .chat-messeges not found');
    }

    this.messagesContainer = messagesContainer;

    this.messages.forEach((messageData, index) => {
      const isMine = messageData.User.id === this.myUserId;
      const nextMessage = this.messages[index + 1];
      const isLastInGroup =
        !nextMessage || nextMessage.User.id !== messageData.User.id;

      const msg = new Message(
        this.messagesContainer,
        messageData,
        isMine,
        isLastInGroup,
        false,
      );
      msg.render();
    });

    this.initUnreadTracking();

    const inputContainer = mainContainer.querySelector<HTMLDivElement>(
      '.messege-input',
    );
    if (!inputContainer) {
      throw new Error('Chat: .messege-input not found');
    }

    this.inputMes = new MessageInput(inputContainer);
    this.inputMes.render();

    if (this.inputMes.textarea) {
      this.inputMes.textarea.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          this.sendEvent(e);
        }
      });
    }

    if (this.inputMes.sendButton) {
      this.inputMes.sendButton.addEventListener('click', (e: MouseEvent) => {
        this.sendEvent(e);
      });
    }

    this.addScrollButton();

    this.messagesContainer.addEventListener('scroll', () => {
      this.handleScrollRead();
    });

    this.rootElement.appendChild(wrapper.firstElementChild as HTMLElement);

    this.scrollToLastRead();

    // Подписка на WS
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

      if (chatIdFromEvent !== this.chatInfo) {
        return;
      }

      const last =
        data.lastMessage ??
        data.last_message ??
        data.message ??
        null;

      const author =
        data.lastMessageAuthor ??
        data.last_message_author ??
        data.author ??
        null;

      if (!last || !author) {
        console.warn('[Chat] WS new_message без lastMessage/lastMessageAuthor', data);
        return;
      }

      if (this.messages.some((m) => m.id === last.id)) {
        return;
      }

      const messageData: ChatMessageView = {
        id: last.id,
        text: last.text,
        created_at: last.createdAt,
        User: {
          id: author.userID,
          full_name: author.fullName,
          avatar: author.avatarPath ?? '',
        },
      };

      if (!this.messagesContainer) return;

      const isMine = messageData.User.id === this.myUserId;

      const msg = new Message(
        this.messagesContainer,
        messageData,
        isMine,
        true,
        true,
      );
      msg.render(true);

      this.messages.push(messageData);

      if (!isMine) {
        this.unreadMessageIds.add(messageData.id);
        EventBus.emit('chatReadUpdated', {
          chatId: this.chatInfo,
          unreadCount: this.unreadMessageIds.size,
          lastReadMessageId: this.lastReadMessageId,
        });
      }

      this.scrollToBottom();
    };

    wsService.on('new_message', this.wsHandler);
  }

  private initUnreadTracking(): void {
    this.unreadMessageIds.clear();

    this.messages.forEach((m) => {
      const isMine = m.User.id === this.myUserId;
      if (isMine) return;

      if (!this.lastReadMessageId || m.id > this.lastReadMessageId) {
        this.unreadMessageIds.add(m.id);
      }
    });

    this.handleScrollRead(true);
  }

  private handleScrollRead(isInitial: boolean = false): void {
    if (!this.messagesContainer) return;
    if (this.unreadMessageIds.size === 0) return;

    const containerTop = this.messagesContainer.scrollTop;
    const containerBottom = containerTop + this.messagesContainer.clientHeight;

    let newLastReadId = this.lastReadMessageId ?? 0;
    const toDelete: number[] = [];

    this.unreadMessageIds.forEach((id) => {
      const el = this.messagesContainer!.querySelector<HTMLElement>(
        `[data-message-id="${id}"]`,
      );
      if (!el) return;

      const top = el.offsetTop;
      const bottom = top + el.offsetHeight;

      if (bottom <= containerBottom) {
        if (id > newLastReadId) {
          newLastReadId = id;
        }
        toDelete.push(id);
      }
    });

    if (newLastReadId !== this.lastReadMessageId) {
      this.lastReadMessageId = newLastReadId;
      toDelete.forEach((id) => this.unreadMessageIds.delete(id));

      if (!isInitial) {
        void this.pushReadState();
      }

      EventBus.emit('chatReadUpdated', {
        chatId: this.chatInfo,
        unreadCount: this.unreadMessageIds.size,
        lastReadMessageId: this.lastReadMessageId,
      });
    }
  }

  private async pushReadState(): Promise<void> {
    if (!this.lastReadMessageId) return;
    if (this.readUpdateInFlight) return;
    this.readUpdateInFlight = true;

    try {
      await updateChatReadState(this.chatInfo, this.lastReadMessageId);
    } catch (e) {
      console.error('Не удалось обновить lastReadMessageId', e);
    } finally {
      this.readUpdateInFlight = false;
    }
  }


  private scrollToBottom(): void {
    if (!this.messagesContainer) return;

    this.messagesContainer.scrollTop =
      this.messagesContainer.scrollHeight -
      this.messagesContainer.clientHeight;
  }

  private scrollToLastRead(): void {
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

    const targetTop =
      el.offsetTop - this.messagesContainer.clientHeight * 0.3;

    this.messagesContainer.scrollTop = Math.max(targetTop, 0);
  }

  private addScrollButton(): void {
    if (!this.messagesContainer) return;

    this.scrollButton = this.messagesContainer.querySelector<HTMLButtonElement>(
      '.scroll-to-bottom-btn',
    );
    if (!this.scrollButton) {
      return;
    }

    this.messagesContainer.addEventListener('scroll', () => {
      if (!this.messagesContainer || !this.scrollButton) return;

      const maxScroll =
        this.messagesContainer.scrollHeight -
        this.messagesContainer.clientHeight;
      const isAtBottom =
        this.messagesContainer.scrollTop >= maxScroll - 200;

      if (isAtBottom) {
        this.scrollButton.classList.remove('visible');
      } else {
        this.scrollButton.classList.add('visible');
      }
    });

    this.scrollButton.addEventListener('click', () => {
      if (!this.messagesContainer) return;

      const el = this.messagesContainer;
      const smoothPart = 700;

      const maxScroll = el.scrollHeight - el.clientHeight;

      el.scrollTop = maxScroll - smoothPart;

      setTimeout(() => {
        el.scrollTo({
          top: maxScroll,
          behavior: 'smooth',
        });
      }, 20);
    });
  }

  private async sendEvent(e: Event): Promise<void> {
    e.preventDefault();
    if (!this.inputMes || !this.messagesContainer) return;

    const text = this.inputMes.getValue();
    if (!text) return;

    const chatID = this.chatInfo;

    try {
      const data = (await sendChatMessage(
        chatID,
        text,
      )) as SentMessageResponse;

      const message: ChatMessageView = {
        id: data.id,
        text,
        created_at: new Date().toISOString(),
        User: {
          id: this.myUserId,
          full_name: this.myUserName,
          avatar: this.myUserAvatar,
        },
      };

      const msg = new Message(
        this.messagesContainer,
        message,
        true,
        true,
        true,
      );
      msg.render(true);

      this.messages.push(message);

      this.inputMes.clear();

      EventBus.emit('chatUpdated', { chatId: this.chatInfo });

      this.lastReadMessageId = message.id;
      this.unreadMessageIds.clear();
      void this.pushReadState();
      EventBus.emit('chatReadUpdated', {
        chatId: this.chatInfo,
        unreadCount: 0,
        lastReadMessageId: this.lastReadMessageId,
      });

      this.scrollToBottom();
    } catch (err) {
      console.error('Ошибка при отправке сообщения:', err);
    }
  }

  destroy(): void {
    if (this.wsHandler) {
      wsService.off?.('new_message', this.wsHandler);
      this.wsHandler = null;
    }
  }
}
