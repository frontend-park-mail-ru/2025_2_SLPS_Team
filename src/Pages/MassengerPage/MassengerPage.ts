import BasePage from '../BasePage';
import MessengerPageTemplate from './MassengerPage.hbs';
import { ChatItem } from '../../components/molecules/ChatItem/ChatItem';
import { Chat } from '../../components/organisms/Chat/Chat';
import { SearchInput } from '../../components/molecules/SearchInput/SearchInput';
import { EventBus } from '../../services/EventBus';
import { authService } from '../../services/AuthService';
import { gsap } from 'gsap';

import { getProfile } from '../../shared/api/profileApi';
import { getChats, getChatWithUser } from '../../shared/api/chatsApi';
import { layout } from '../LayoutManager';

import type { ChatItemData, ProfileData } from '../../shared/types/components';

console.log('MessengerPage module loaded');

type ChatOpenData = {
  id: number;
  avatarPath: string;
  name: string;
  chatId?: number;
};

type WsMessagePacket = { Data?: unknown } & Record<string, unknown>;
type WsChatUpdatePayload = { id?: number };

type OpenChatEventPayload = {
  data: { id: number; avatarPath: string; name: string };
};

type ChatUpdatedEventPayload = { chatId: number };
type ChatReadUpdatedEventPayload = { chatId: number; unreadCount: number; lastReadMessageId: number };

type ChatWithUserResponse = { chatID: number };

export class MessengerPage extends BasePage {
  private chats: ChatItemData[] = [];
  private openChat: Chat | null = null;

  private wrapper: HTMLElement | null = null;
  private chatWrapper: HTMLElement | null = null;

  private activeChatItem: ChatItem | null = null;
  private myUserId: number = -1;

  private chatsSearch: SearchInput | null = null;
  private chatItems: ChatItem[] = [];
  private wsService: any;

  constructor(rootElement: HTMLElement) {
    super(rootElement);
  }

  async render(): Promise<void> {
    this.chats = (await getChats(1)) as ChatItemData[];

    const uid = (await authService.getUserId()) as number | null | undefined;
    if (uid == null) return;
    this.myUserId = uid;

    this.wrapper = document.createElement('div');
    this.wrapper.innerHTML = MessengerPageTemplate({});

    const chatsContainer = this.wrapper.querySelector('.chats-container') as HTMLElement | null;
    if (!chatsContainer) return;

    const searchHost = chatsContainer.querySelector('.chats-sreach-container') as HTMLElement | null;
    if (!searchHost) return;

    this.chatsSearch = new SearchInput(searchHost);
    this.chatsSearch.render();

    const chatItemsBlock = chatsContainer.querySelector('.chat-items-block') as HTMLElement | null;
    if (!chatItemsBlock) return;

    this.chats.forEach((chatData: ChatItemData) => {
      const chatItem = new ChatItem(chatItemsBlock, chatData);
      chatItem.render();

      if (!chatItem.wrapper) return;

      this.chatItems.push(chatItem);

      chatItem.wrapper.addEventListener('click', async () => {
        if (this.activeChatItem && this.activeChatItem !== chatItem) {
          this.activeChatItem.rmActive();
        }
        this.activeChatItem = chatItem;
        chatItem.makeActive();

        await this.OpenChat(chatData as unknown as ChatOpenData);

        if (window.innerWidth <= 768 && this.wrapper) {
          layout.toggleMenu();
          const chatsContainerEl = this.wrapper.querySelector('.chats-container') as HTMLElement | null;
          const chatBlockEl = this.wrapper.querySelector('.chat-block') as HTMLElement | null;
          chatsContainerEl?.classList.add('hide');
          chatBlockEl?.classList.add('open');
        }
      });
    });

    this.rootElement.appendChild(this.wrapper);

    await this.loadSocet();
    this.wsService.on('new_message', (packet: WsMessagePacket) => {
      const raw = (packet?.Data ?? packet) as unknown;
      const data = raw as WsChatUpdatePayload;

      if (!data || typeof data.id !== 'number') return;

      const openChatId = this.openChat?.getChatId();

      if (openChatId === data.id) return;

      this.UpdateChat(data.id);
    });



    EventBus.on('openChat', async ({ data }: OpenChatEventPayload) => {
      try {
        const responseData = (await getChatWithUser(data.id)) as ChatWithUserResponse;

        const chatData: ChatOpenData = {
          id: responseData.chatID,
          avatarPath: data.avatarPath,
          name: data.name,
          chatId: responseData.chatID,
        };

        await this.OpenChat(chatData);

        if (window.innerWidth <= 768 && this.wrapper) {
          layout.toggleMenu();
          const chatsContainerEl = this.wrapper.querySelector('.chats-container') as HTMLElement | null;
          const chatBlockEl = this.wrapper.querySelector('.chat-block') as HTMLElement | null;
          chatsContainerEl?.classList.add('hide');
          chatBlockEl?.classList.add('open');
        }
      } catch (err) {
        console.error('Ошибка открытия чата:', err);
      }
    });

    EventBus.on('chatUpdated', ({ chatId }: ChatUpdatedEventPayload) => {
      const openChatId = this.openChat?.getChatId();
      if (openChatId === chatId) return;
      this.UpdateChat(chatId);
    });

    EventBus.on(
      'chatReadUpdated',
      ({ chatId, unreadCount, lastReadMessageId }: ChatReadUpdatedEventPayload) => {
        const item = this.chatItems.find((i) => i.chatData.id === chatId);
        if (!item) return;

        item.setUnreadCount(unreadCount);
        (item.chatData as ChatItemData).lastReadMessageId = lastReadMessageId;
      },
    );
  }

  private async OpenChat(data: ChatOpenData): Promise<void> {
    if (!this.wrapper) return;

    this.chatWrapper = this.wrapper.querySelector('.chat-block') as HTMLElement | null;
    if (!this.chatWrapper) return;

    this.chatWrapper.innerHTML = '';

    const profile = await this.fetchCurrentUserProfile();
    const fullName = `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim();
    const avatar = profile.avatarPath ?? '';

    if (window.innerWidth <= 768) {
      this.openChat = new Chat(this.chatWrapper, this.myUserId, fullName, avatar, data, {
        hasBackButton: true,
        onBack: () => {
          if (!this.wrapper || !this.chatWrapper) return;

          const chatsContainer = this.wrapper.querySelector('.chats-container') as HTMLElement | null;

          this.chatWrapper.style.transform = 'translateX(0)';
          this.chatWrapper.style.opacity = '1';

          gsap.to(this.chatWrapper, {
            x: '100%',
            opacity: 0,
            duration: 0.25,
            ease: 'power1.inOut',
            onComplete: () => {
              if (!this.chatWrapper) return;

              this.chatWrapper.classList.remove('open');

              this.chatWrapper.style.transform = '';
              this.chatWrapper.style.opacity = '';

              chatsContainer?.classList.remove('hide');
              this.activeChatItem?.rmActive();
              layout.toggleMenu();
            },
          });
        },
      });

      this.openChat.render();
    } else {
      this.openChat = new Chat(this.chatWrapper, this.myUserId, fullName, avatar, data);
      this.openChat.render();
    }

    const openedChatId = data.chatId ?? data.id;
    const openedChatItem = this.chatItems.find((item) => item.chatData.id === openedChatId);

    const hc = openedChatItem as unknown as { hideCounter?: () => void };
    if (hc?.hideCounter) hc.hideCounter();
  }

  private UpdateChat(chatId: number): void {
    if (!this.wrapper) return;

    const chatItem = this.chatItems.find((item) => item.chatData.id === chatId);
    if (!chatItem || !chatItem.wrapper) return;

    const container = this.wrapper.querySelector('.chat-items-block') as HTMLElement | null;
    if (!container) return;

    const el = chatItem.wrapper;

    if (container.firstChild !== el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(10px)';

      container.prepend(el);

      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.05,
        ease: 'power1.out',
        onComplete: () => {
          el.style.opacity = '';
          el.style.transform = '';
        },
      });
    }

    const openChatId = this.openChat?.getChatId();

    if (this.openChat && chatItem.chatData.id === openChatId) {
      chatItem.hideCounter();
      return;
    }

    chatItem.showCounter();

  }

  async loadSocet() {
      const module = await import('services/WebSocketService');
      this.wsService = module.wsService;
  }

  private async fetchCurrentUserProfile(): Promise<ProfileData> {
    return (await getProfile(this.myUserId)) as ProfileData;
  }
}
