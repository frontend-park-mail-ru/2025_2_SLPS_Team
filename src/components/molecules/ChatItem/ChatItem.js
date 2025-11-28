import ChatItemTemplate from './ChatItem.hbs'
import { UserPhotoItem } from '../../atoms/UserPhotoItem/UserPhotoItem.js';

export class ChatItem {
    constructor(rootElement, chatData) {
        this.rootElement = rootElement;
        this.wrapper = null;
        this.chatData = chatData;
        this.photoWrapper = null;
        this.photoElement = null;
        this.mesCounter  = null;
    }

    render() {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = ChatItemTemplate(this.chatData);
        this.wrapper = tempDiv.querySelector('.chat-item');

        this.photoWrapper = this.wrapper.querySelector('.user-avatar-container');
        this.photoElement = new UserPhotoItem(this.photoWrapper, this.chatData.avatarPath);
        this.photoElement.render();

        this.mesCounter = this.wrapper.querySelector('.new-mess-counter');
        this.setUnreadCount(this.chatData.unreadCount || 0);

        this.rootElement.appendChild(this.wrapper);
    }

    makeActive() {
        this.wrapper.classList.add('active');
        this.setUnreadCount(0);
    }

    rmActive() {
        this.wrapper.classList.remove('active');
    }

    setUnreadCount(count) {
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

    showCounter() {
        this.setUnreadCount((this.chatData.unreadCount || 0) + 1);
    }

    hideCounter() {
        this.setUnreadCount(0);
    }
}
