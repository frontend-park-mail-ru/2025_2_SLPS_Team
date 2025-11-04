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
        this.counter = 0;
    }

    render() {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = ChatItemTemplate(this.chatData);
        this.wrapper = tempDiv.querySelector('.chat-item');

        this.photoWrapper = this.wrapper.querySelector('.user-avatar-container')
        this.photoElement = new UserPhotoItem(this.photoWrapper, this.chatData.avatarPath);
        this.photoElement.render();

        this.mesCounter = this.wrapper.querySelector('.new-mess-counter');

        this.rootElement.appendChild(this.wrapper);
    }

    makeActive() {
        this.wrapper.classList.add('active');
        this.hideCounter();
    }

    rmActive() {
        this.wrapper.classList.remove('active');
        this.hideCounter();
    }

    showCounter() {
        this.mesCounter.classList.remove('hide');
    }

    hideCounter() {
        this.mesCounter.classList.add('hide');
    }

    updateCounter() {
        this.mesCounter.textContent = this.counter;
    }

}