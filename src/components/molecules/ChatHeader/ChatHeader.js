import ChatHeaderTemplate from './ChatHeader.hbs'
import { UserPhotoItem } from '../../atoms/UserPhotoItem/UserPhotoItem.js';


export class ChatHeader {
    constructor(rootElement, profileData, name, avatar) {
        this.rootElement = rootElement;
        this.profileData = profileData;
        this.wrapper = null;
        this.avatar = null;
        this.name = name,
        this.avatar = avatar
    }

    render() {
        console.log(this.name)
        console.log(this.avatar);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = ChatHeaderTemplate({ name: this.name });
        this.wrapper = tempDiv.firstElementChild;

        this.avatar = new UserPhotoItem(this.wrapper.querySelector('.profile-avatar-container'), this.avatar, this.profileData);
        this.avatar.render();
        
        this.rootElement.appendChild(this.wrapper);
    }
}