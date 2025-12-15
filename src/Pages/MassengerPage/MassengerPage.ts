import BasePage from '../BasePage';
import MessengerPageTemplate from './MassengerPage.hbs';
import { ChatItem } from '../../components/molecules/ChatItem/ChatItem';
import { Chat } from '../../components/organisms/Chat/Chat';
import { SearchInput } from '../../components/molecules/SearchInput/SearchInput';
import { EventBus } from '../../services/EventBus';
import { authService } from '../../services/AuthService';
import { wsService } from '../../services/WebSocketService';
import { gsap } from 'gsap';

import { getProfile } from '../../shared/api/profileApi';
import { getChats, getChatWithUser } from '../../shared/api/chatsApi';

import type { ChatItemData, ProfileData } from '../../shared/types/components';

type ChatWithUserResponse = {
  chatID: number;
};

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

type ChatReadUpdatedEventPayload = {
  chatId: number;
  unreadCount: number;
  lastReadMessageId: number | null;
};

export class MassengerPage extends BasePage {
  wrapper: HTMLElement | null = null;

  private myUserId: number;
  private profile: ProfileData | null = null;

  private chatWrapper: HTMLElement | null = null;
  private openChat: Chat | null = null;

  private chatItems: any[] = [];
  private searchInput: SearchInput | null = null;

  constructor(rootElement: HTMLElement = document.createElement('div')) {
    super(rootElement);
    this.myUserId = authService.getUserId() ?? 0;
  }

  async render(): Promise<void> {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = MessengerPageTemplate({});
    const root = tempDiv.firstElementChild as HTMLElement | null;
    if (!root) throw new Error('[MassengerPage] template root not found');
    this.wrapper = root;

    this.chatWrapper = this.wrapper.querySelector('.chat-block') as HTMLElement | null;

    const profile = await this.fetchCurrentUserProfile();
    this.profile = profile;

    const fullName = `${(profile as any).firstName ?? ''} ${(profile as any).lastName ?? ''}`.trim();
    const avatar =
      (profile as any).photo ??
      (profile as any).avatarPath ??
      (profile as any).avatar ??
      '';

    const searchContainer = this.wrapper.querySelector('.search-chat-block') as HTMLElement | null;
    if (searchContainer) {
      this.searchInput = new SearchInput(searchContainer);
      this.searchInput.render();

      this.searchInput.onInput((value) => {
        this.filterChats(value);
      });
    }

    await this.renderChatsList();

    wsService.on('chat_updated', (packet: WsMessagePacket) => {
      const raw = (packet?.Data ?? packet) as unknown;
      const data = raw as WsChatUpdatePayload;

      if (!data || typeof data.id !== 'number') return;
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

        if (this.chatWrapper) {
          this.chatWrapper.innerHTML = '';
          this.openChat?.destroy?.();

          this.openChat = new Chat(this.chatWrapper, this.myUserId, fullName, avatar, chatData, {
            initialLastReadMessageId: null,
          });

          await this.openChat.render();

          const chatBlockEl = this.wrapper?.querySelector('.chat-block');
          chatBlockEl?.classList.add('open');
        }
      } catch (err) {
        console.error('Ошибка открытия чата:', err);
      }
    });

    EventBus.on('chatUpdated', ({ chatId }: ChatUpdatedEventPayload) => {
      this.UpdateChat(chatId);
    });

    EventBus.on(
      'chatReadUpdated',
      ({ chatId, unreadCount, lastReadMessageId }: ChatReadUpdatedEventPayload) => {
        const item = this.chatItems.find((x) => x.chatData?.id === chatId);
        if (!item) return;

        item.setUnreadCount?.(unreadCount);
        item.setLastReadMessageId?.(lastReadMessageId);

        const openChatId = (this.openChat as any)?.chatInfo;
        if (this.openChat && chatId === openChatId) {
          item.hideCounter?.();
        }

        const openedChatId = (this.openChat as any)?.chatInfo;
        const openedChatItem = this.chatItems.find((i) => i.chatData?.id === openedChatId);
        openedChatItem?.hideCounter?.();
      },
    );

    return;
  }

  private async renderChatsList(): Promise<void> {
    if (!this.wrapper) return;

    const container = this.wrapper.querySelector('.chat-items-block') as HTMLElement | null;
    if (!container) return;

    container.innerHTML = '';

    const chats = (await getChats()) as ChatItemData[];

    this.chatItems = [];

    for (const chat of chats) {
      const item = new (ChatItem as any)(container, chat);
      item.render();
      this.chatItems.push(item);
    }
  }

  private filterChats(value: string): void {
    const query = value.trim().toLowerCase();

    for (const item of this.chatItems) {
      const name = String(item.chatData?.name ?? '').toLowerCase();
      const visible = name.includes(query);
      if (item.wrapper) {
        item.wrapper.style.display = visible ? '' : 'none';
      }
    }
  }

  private UpdateChat(chatId: number): void {
    if (!this.wrapper) return;

    const chatItem = this.chatItems.find((item) => item.chatData?.id === chatId);
    if (!chatItem || !chatItem.wrapper) return;

    const container = this.wrapper.querySelector('.chat-items-block') as HTMLElement | null;
    if (!container) return;

    const el = chatItem.wrapper;

    if (container.firstChild !== el) {
      container.removeChild(el);
      container.insertBefore(el, container.firstChild);

      gsap.fromTo(
        el,
        { opacity: 0.6, y: -10 },
        {
          opacity: 1,
          y: 0,
          duration: 0.25,
          ease: 'power1.out',
          onComplete: () => {
            el.style.opacity = '';
            el.style.transform = '';
          },
        },
      );
    }

    const openChatId = (this.openChat as any)?.chatInfo;
    if (!this.openChat || chatItem.chatData.id !== openChatId) {
      chatItem.showCounter?.();
    }
  }

  private async fetchCurrentUserProfile(): Promise<ProfileData> {
    return (await getProfile(this.myUserId)) as ProfileData;
  }
}
