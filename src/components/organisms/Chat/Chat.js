import ChatTemplate from './Chat.hbs';
import { ChatHeader } from '../../molecules/ChatHeader/ChatHeader.ts';
import { Message } from '../../atoms/Message/Message.ts';
import { MessageInput } from '../../molecules/MessageInput/MessageInput.js';

import { wsService } from '../../../services/WebSocketService.js';
import { EventBus } from '../../../services/EventBus.js';

import {
  getChatMessages,
  sendChatMessage,
  updateChatReadState,
} from '../../../shared/api/chatsApi.js';

export class Chat {
  constructor(rootElement, myUserId, myUserName, myUserAvatar, data, options={}) {
    this.rootElement = rootElement;
    this.chatInfo = data.id;
    this.myUserId = myUserId;
    this.myUserName = myUserName;
    this.myUserAvatar = myUserAvatar;

    this.messages = [];
    this.chatHeader = null;
    this.inputMes = null;
    this.messagesContainer = null;
    this.scrollButton = null;

    this.data = data;

    this.hasBackButton = options.hasBackButton || false;
    this.onBack = options.onBack || null;

    this.lastReadMessageId =
      data.lastReadMessageId || data.lastReadMessageID || null;
    this.unreadMessageIds = new Set();
    this.readUpdateInFlight = false;

    this.wsHandler = null;
  }

  async render() {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = ChatTemplate(this.chatInfo);

    const mainContainer = wrapper.querySelector('.chat-container');

    const rawData = await getChatMessages(this.chatInfo, 1);
    const rawMessages = rawData.Messages || [];
    const authors = rawData.Authors || {};

    this.messages = rawMessages.map((msg) => ({
      id: msg.id,
      text: msg.text,
      created_at: msg.createdAt,
      User: {
        id: msg.authorID,
        full_name: authors[msg.authorID]?.fullName || '',
        avatar: authors[msg.authorID]?.avatarPath || '',
      },
    }));

    this.chatHeader = new ChatHeader(
      mainContainer.querySelector('.chat-header-container'),
      null,
      this.data.name,
      this.data.avatarPath,
      this.hasBackButton,
      this.onBack
    );
    this.chatHeader.render();

    this.messagesContainer = mainContainer.querySelector('.chat-messeges');

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

    this.inputMes = new MessageInput(
      mainContainer.querySelector('.messege-input'),
    );
    this.inputMes.render();

    this.inputMes.textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        this.sendEvent(e);
      }
    });

    this.inputMes.sendButton.addEventListener('click', (e) => {
      this.sendEvent(e);
    });

    this.addScrollButton();

    this.messagesContainer.addEventListener('scroll', () => {
      this.handleScrollRead();
    });

    this.rootElement.appendChild(wrapper.firstElementChild);

    this.scrollToLastRead();

      this.wsHandler = (data) => {
      console.log('[WS new_message in Chat]', data, 'current chat:', this.chatInfo);

      if (!data) return;

      const chatIdFromEvent =
        data.id ??
        data.chatId ??
        data.chatID ??
        data.chat_id ??
        data.lastMessage?.chatID;

      console.log(
        '[WS new_message] chatIdFromEvent =',
        chatIdFromEvent,
        'this.chatInfo =',
        this.chatInfo,
      );

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

      const messageData = {
        id: last.id,
        text: last.text,
        created_at: last.createdAt,
        User: {
          id: author.userID,
          full_name: author.fullName,
          avatar: author.avatarPath || '',
        },
      };

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


  initUnreadTracking() {
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

  handleScrollRead(isInitial = false) {
    if (this.unreadMessageIds.size === 0) return;

    const containerTop = this.messagesContainer.scrollTop;
    const containerBottom =
      containerTop + this.messagesContainer.clientHeight;

    let newLastReadId = this.lastReadMessageId || 0;
    const toDelete = [];

    this.unreadMessageIds.forEach((id) => {
      const el = this.messagesContainer.querySelector(
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
        this.pushReadState();
      }

      EventBus.emit('chatReadUpdated', {
        chatId: this.chatInfo,
        unreadCount: this.unreadMessageIds.size,
        lastReadMessageId: this.lastReadMessageId,
      });
    }
  }

  async pushReadState() {
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

  scrollToBottom() {
    this.messagesContainer.scrollTop =
      this.messagesContainer.scrollHeight -
      this.messagesContainer.clientHeight;
  }

  scrollToLastRead() {
    if (!this.lastReadMessageId) {
      this.scrollToBottom();
      return;
    }

    const el = this.messagesContainer.querySelector(
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

  addScrollButton() {
    this.scrollButton =
      this.messagesContainer.querySelector('.scroll-to-bottom-btn');

    this.messagesContainer.addEventListener('scroll', () => {
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

  async sendEvent(e) {
    e.preventDefault();
    const text = this.inputMes.getValue();
    if (!text) return;

    const chatID = this.chatInfo;

    try {
      const data = await sendChatMessage(chatID, text);

      const message = {
        id: data.id,
        text,
        created_at: new Date().toISOString(),
        User: {
          id: this.myUserId,
          full_name: this.myUserName,
          avatar: this.myUserAvatar,
        },
      };

      const msg = new Message(this.messagesContainer, message, true);
      msg.render(true);

      this.messages.push(message);

      this.inputMes.clear();

      EventBus.emit('chatUpdated', { chatId: this.chatInfo });

      this.lastReadMessageId = message.id;
      this.unreadMessageIds.clear();
      this.pushReadState();
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
}
