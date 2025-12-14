import ChatItemTemplate from './ChatItem.hbs';
import { UserPhotoItem } from '../../atoms/UserPhotoItem/UserPhotoItem';
import type { ChatItemData } from '@shared/types/components';

export class ChatItem {
  rootElement: HTMLElement;
  wrapper: HTMLElement | null = null;

  chatData: ChatItemData;

  photoWrapper: HTMLElement | null = null;
  photoElement: UserPhotoItem | null = null;

  mesCounter: HTMLElement | null = null;

  counter = 0;

  constructor(rootElement: HTMLElement, chatData: ChatItemData) {
    this.rootElement = rootElement;
    this.chatData = chatData;
  }

  render(): void {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = ChatItemTemplate(this.chatData);

    const root =
      (tempDiv.querySelector('.chat-item') as HTMLElement | null) ??
      (tempDiv.firstElementChild instanceof HTMLElement ? tempDiv.firstElementChild : null);

    if (!root) return;

    this.wrapper = root;

    this.photoWrapper = this.wrapper.querySelector('.user-avatar-container') as HTMLElement | null;
    if (this.photoWrapper) {
      this.photoElement = new UserPhotoItem(this.photoWrapper, this.chatData.avatarPath);
      this.photoElement.render();
    }

    this.mesCounter = this.wrapper.querySelector('.new-mess-counter') as HTMLElement | null;

    this.setUnreadCount(this.chatData.unreadCount ?? 0);

    this.rootElement.appendChild(this.wrapper);
  }

  makeActive(): void {
    this.wrapper?.classList.add('active');
    this.setUnreadCount(0);
  }

  rmActive(): void {
    this.wrapper?.classList.remove('active');
  }

  setUnreadCount(count: number): void {
    this.chatData.unreadCount = count;

    if (!this.mesCounter) return;

    if (count > 0) {
      this.mesCounter.textContent = String(count);
      this.mesCounter.classList.remove('hide');
    } else {
      this.mesCounter.textContent = '';
      this.mesCounter.classList.add('hide');
    }
  }

  showCounter(): void {
    this.setUnreadCount((this.chatData.unreadCount ?? 0) + 1);
  }

  hideCounter(): void {
    this.setUnreadCount(0);
  }
}
