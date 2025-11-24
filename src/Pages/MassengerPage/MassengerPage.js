import BasePage from '../BasePage.js';
import MessengerPageTemplate from './MassengerPage.hbs';
import { ChatItem } from '../../components/molecules/ChatItem/ChatItem.js';
import { Chat } from '../../components/organisms/Chat/Chat.js';
import { SearchInput } from '../../components/molecules/SearchInput/SearchInput.js';
import { EventBus } from '../../services/EventBus.js';
import { authService } from '../../services/AuthService.js';
import { wsService } from '../../services/WebSocketService.js';
import { gsap } from "gsap";

import { getProfile } from '../../shared/api/profileApi.js';
import { getChats, getChatWithUser } from '../../shared/api/chatsApi.js';
import { cachedFetch } from "../../services/CacheService.js"; 

export class MessengerPage extends BasePage {
  constructor(rootElement) {
    super(rootElement)
    this.chats = [];
    this.openChat = null;
    this.wrapper = null;
    this.chatWrapper = null;
    this.activeChatItem = null;
    this.myUserId = null;
    this.chatsSearch = null;
    this.chatItems = [];
  }

  async render() {
    this.chats = await getChats(1);
    this.myUserId = await authService.getUserId();

    this.wrapper = document.createElement('div');
    this.wrapper.innerHTML = MessengerPageTemplate();

    const chatBlock = this.wrapper.querySelector('.chat-block');

    const chatsContainer = this.wrapper.querySelector('.chats-container');
    this.chatsSearch = new SearchInput(chatsContainer.querySelector('.chats-sreach-container'));
    this.chatsSearch.render();

    const chatItemsBlock = chatsContainer.querySelector('.chat-items-block');

    this.chats.forEach(chatData => {
      const chatItem = new ChatItem(chatItemsBlock, chatData);
      chatItem.render();

      this.chatItems.push(chatItem);

        chatItem.wrapper.addEventListener('click', async () => {
        if (this.activeChatItem && this.activeChatItem !== chatItem) {
            this.activeChatItem.rmActive();
        }
        this.activeChatItem = chatItem;
        chatItem.makeActive();

        await this.OpenChat(chatData);

        if (window.innerWidth <= 768) {
            const chatsContainer = this.wrapper.querySelector('.chats-container');
            const chatBlock = this.wrapper.querySelector('.chat-block');
            chatsContainer.classList.add('hide');
            chatBlock.classList.add('open');
        }
        });
    });

    this.rootElement.appendChild(this.wrapper);

    wsService.on('message', (packet) => {
    console.log('[WS message in MessengerPage]', packet);

    const data = packet.Data || packet;

    if (!data || typeof data.id === 'undefined') {
      return;
    }

    this.UpdateChat(data.id);
  });

    EventBus.on('openChat', async ({ data }) => {
      try {
        const responseData = await getChatWithUser(data.id);
        const chatData = {
          id: responseData.chatID,
          avatarPath: data.avatarPath,
          name: data.name,
        };
        await this.OpenChat(chatData);
        if (window.innerWidth <= 768) {
            const chatsContainer = this.wrapper.querySelector('.chats-container');
            const chatBlock = this.wrapper.querySelector('.chat-block');
            chatsContainer.classList.add('hide');
            chatBlock.classList.add('open');
        }
      } catch (err) {
        console.error('Ошибка открытия чата:', err);
      }
    });

    EventBus.on('chatUpdated', ({ chatId }) => {
      this.UpdateChat(chatId);
    });
    EventBus.on('chatReadUpdated', ({ chatId, unreadCount, lastReadMessageId }) => {
      const item = this.chatItems.find((i) => i.chatData.id === chatId);
      if (!item) return;

      item.setUnreadCount(unreadCount);
      item.chatData.lastReadMessageId = lastReadMessageId;
    });
  }

  async OpenChat(data) {
    this.chatWrapper = this.wrapper.querySelector('.chat-block');
    this.chatWrapper.innerHTML = '';

    const profile = await this.fetchCurrentUserProfile();
    const fullName = `${profile.firstName} ${profile.lastName}`;
    const avatar = profile.avatarPath;

    this.openChat = new Chat(this.chatWrapper, this.myUserId, fullName, avatar, data);
    this.openChat.render();

    const openedChatItem = this.chatItems.find(item => item.chatData.id === data.chatId);
    if (openedChatItem && typeof openedChatItem.hideCounter === 'function') {
      openedChatItem.hideCounter();
    }

    if (window.innerWidth <= 768) {
        this.addSwipeToClose(this.chatWrapper);
    }
  }

  UpdateChat(chatId) {
    const chatItem = this.chatItems.find(item => item.chatData.id === chatId);
    if (!chatItem) return;

    const container = this.wrapper.querySelector('.chat-items-block');

    if (container.firstChild !== chatItem.wrapper) {
      chatItem.wrapper.style.opacity = '0';
      chatItem.wrapper.style.transform = 'translateY(10px)';

      container.prepend(chatItem.wrapper);

      gsap.to(chatItem.wrapper, {
        opacity: 1,
        y: 0,
        duration: 0.05,
        ease: 'power1.out',
        onComplete: () => {
          chatItem.wrapper.style.opacity = '';
          chatItem.wrapper.style.transform = '';
        }
      });
    }

    if (!this.openChat || chatItem.chatData.id !== this.openChat.chatInfo) {
      chatItem.showCounter();
    }
  }
  
  addSwipeToClose(element) {
        let startX = 0;
        let currentX = 0;
        let isDragging = false;

        const onPointerDown = (e) => {
            isDragging = true;
            startX = e.touches ? e.touches[0].clientX : e.clientX;
            element.style.transition = '';
        };

        const onPointerMove = (e) => {
            if (!isDragging) return;
            currentX = e.touches ? e.touches[0].clientX : e.clientX;
            const dx = currentX - startX;
            if (dx < 0) {
                element.style.transform = `translateX(${dx}px)`;
            }
        };

        const onPointerUp = () => {
            if (!isDragging) return;
            isDragging = false;
            const dx = currentX - startX;
            element.style.transition = 'transform 0.3s ease';

            if (dx < -100) {
                element.style.transform = 'translateX(100%)';
                this.wrapper.querySelector('.chats-container').classList.remove('hide');
                element.classList.remove('open');
                this.activeChatItem?.rmActive();
            } else {
                element.style.transform = 'translateX(0)';
            }
        };

        element.addEventListener('touchstart', onPointerDown);
        element.addEventListener('touchmove', onPointerMove);
        element.addEventListener('touchend', onPointerUp);

        element.addEventListener('mousedown', onPointerDown);
        element.addEventListener('mousemove', onPointerMove);
        element.addEventListener('mouseup', onPointerUp);
    }

  async fetchCurrentUserProfile() {
    return await getProfile(this.myUserId);
  }
}
