import ChatHeaderTemplate from './ChatHeader.hbs'
import { UserPhotoItem } from '../../atoms/UserPhotoItem/UserPhotoItem.ts';


export class ChatHeader {
    constructor(rootElement, profileData, name, avatar, hasBackButton, onBack) {
        this.rootElement = rootElement;
        this.profileData = profileData;
        this.wrapper = null;
        this.avatar = null;
        this.name = name,
        this.avatar = avatar
        this.hasBackButton = hasBackButton;
        this.onBack = onBack;
    }

    render() {
        console.log(this.profileData);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = ChatHeaderTemplate({ name: this.name, hasBackButton: this.hasBackButton});
        this.wrapper = tempDiv.firstElementChild;

        this.avatar = new UserPhotoItem(this.wrapper.querySelector('.profile-avatar-container'), this.avatar, this.profileData);
        this.avatar.render();

        if (this.hasBackButton) {
        const backBtn = this.wrapper.querySelector('.chat-back-btn');
        if (backBtn && typeof this.onBack === 'function') {
                backBtn.addEventListener('click', this.onBack);
            }
        }
        
        this.rootElement.appendChild(this.wrapper);
    }
}