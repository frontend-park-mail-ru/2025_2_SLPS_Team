import BasePage from '../BasePage.js';
import MessengerPageTemplate from './MassengerPage.hbs';
import { ChatItem } from '../../components/molecules/ChatItem/ChatItem.js';
import { Chat } from '../../components/organisms/Chat/Chat.js';
import { SearchInput } from '../../components/molecules/SearchInput/SearchInput.js';
import { EventBus } from '../../services/EventBus.js';
import { authService } from '../../services/AuthService.js';
import { wsService } from '../../services/WebSocketService.js';
import { gsap } from "gsap";
import { cachedFetch } from "../../services/CacheService.js";


async function getChatsData() {
  const response = await cachedFetch(
    `${process.env.API_BASE_URL}/api/chats?page=1`,
    { credentials: 'include' },
    "messenger-cache-v1"
  );

  if (!response.ok) throw new Error(`Ошибка запроса: ${response.status}`);
  return await response.json();
}

export class MessengerPage extends BasePage {
  constructor(rootElement) {
    super(rootElement);
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
    this.chats = await getChatsData();
    this.myUserId = await authService.getUserId();

    this.wrapper = document.createElement('div');
    this.wrapper.innerHTML = MessengerPageTemplate();

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
        await this.OpenChat(chatData.id);
      });
    });

    this.rootElement.appendChild(this.wrapper);

    EventBus.on('openChat', async ({ userId }) => {
      try {
        const response = await cachedFetch(
          `${process.env.API_BASE_URL}/api/chats/user/${userId}`,
          { credentials: 'include' },
          "messenger-cache-v1"
        );

        if (!response.ok) throw new Error(`Ошибка при получении/создании чата: ${response.status}`);
        const data = await response.json();
        const chatId = data.chatID;
        await this.OpenChat(chatId);
      } catch (err) {
        console.error('Ошибка открытия чата:', err);
      }
    });
  }

  async OpenChat(chatId) {
    this.chatWrapper = this.wrapper.querySelector('.chat-block');
    this.chatWrapper.innerHTML = '';

    const profile = await this.fetchCurrentUserProfile();
    const fullName = `${profile.firstName} ${profile.lastName}`;
    const avatar = profile.avatarPath;

    this.openChat = new Chat(this.chatWrapper, chatId, this.myUserId, fullName, avatar);
    this.openChat.render();
  }

  UpdateChat(chatId) {
    const chatItem = this.chatItems.find(item => item.chatData.id === chatId);
    if (!chatItem) return;

    const container = this.wrapper.querySelector('.chat-items-block');
    if (container.firstChild === chatItem.wrapper) return;

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

    chatItem.updateCounter();
  }

  async fetchCurrentUserProfile() {
    const response = await cachedFetch(
      `${process.env.API_BASE_URL}/api/profile/${this.myUserId}`,
      { credentials: "include" },
      "messenger-cache-v1"
    );
    if (!response.ok) throw new Error(`Ошибка запроса: ${response.status}`);
    return await response.json();
  }
}
