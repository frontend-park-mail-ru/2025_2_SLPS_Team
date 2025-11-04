import ChatHeaderTemplate from './ChatHeader.hbs'
import { UserPhotoItem } from '../../atoms/UserPhotoItem/UserPhotoItem.js';


export class ChatHeader {
    constructor(rootElement, profileData) {
        this.rootElement = rootElement;
        this.profileData = profileData;
        this.wrapper = null;
        this.avatar = null;
    }

    render() {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = ChatHeaderTemplate(this.profileData);
        this.wrapper = tempDiv.firstElementChild;

        this.avatar = new UserPhotoItem(this.wrapper.querySelector('.profile-avatar-container'), `${process.env.API_BASE_URL}/uploads/${this.profileData.avatarPath}`);
        this.avatar.render();
        
        this.rootElement.appendChild(this.wrapper);
    }
}