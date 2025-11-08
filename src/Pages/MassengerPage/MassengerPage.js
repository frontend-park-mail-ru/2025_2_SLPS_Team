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
        await this.OpenChat(chatData);
      });
    });

    this.rootElement.appendChild(this.wrapper);

    wsService.on('new_message', (data) => {
        this.UpdateChat(data.id);
    });

    EventBus.on('openChat', async ({ data }) => {
      try {
        console.log(data);
        const response = await cachedFetch(
          `${process.env.API_BASE_URL}/api/chats/user/${data.id}`,
          { credentials: 'include' },
          "messenger-cache-v1"
        );
        const responseData = await response.json();
        console.log(responseData.id)
        let chatData = {
            id: responseData.chatID,
            avatarPath: data.avatarPath,
            name: data.name
        }
        console.log(data);
        await this.OpenChat(chatData);
      } catch (err) {
        console.error('Ошибка открытия чата:', err);
      }
    });

    EventBus.on('chatUpdated', ({ chatId }) => {
        this.UpdateChat(chatId);
    });
  }

  async OpenChat(data) {
    console.log(data);
    this.chatWrapper = this.wrapper.querySelector('.chat-block');
    this.chatWrapper.innerHTML = '';

    const profile = await this.fetchCurrentUserProfile();
    const fullName = `${profile.firstName} ${profile.lastName}`;
    const avatar = profile.avatarPath;
    console.log(profile)
    this.openChat = new Chat(this.chatWrapper, this.myUserId, fullName, avatar, data);
    this.openChat.render();

    const openedChatItem = this.chatItems.find(item => item.chatData.id === data.chatId);
    if (openedChatItem && typeof openedChatItem.hideCounter === 'function') {
        openedChatItem.hideCounter();
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

        if (chatItem.chatData.id !== this.openChat.chatInfo) {
            chatItem.showCounter();
        }
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
