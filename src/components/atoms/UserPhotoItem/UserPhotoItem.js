import { navigateTo } from '../../../index.js';
import UserPhotoItemTemplate from './UserPhotoItem.hbs'

export class UserPhotoItem {
    constructor(rootElement, photoPath, userID) {
        this.rootElement = rootElement;
        this.wrapper = null;
        this.photoPath = photoPath
        this.userID = userID
    }

    render() {
        const tempDiv = document.createElement('div');
        console.log(this.photoPath)
        let photoPath;
        if (!this.photoPath || this.photoPath === 'null') {
            photoPath = '/public/globalImages/DefaultAvatar.svg';
        } else {
            photoPath = `${process.env.API_BASE_URL}/uploads/${this.photoPath}`;
        }
        tempDiv.innerHTML = UserPhotoItemTemplate({ photoPath: photoPath });

        this.wrapper = tempDiv.firstElementChild;

        const photoItem = this.wrapper.querySelector('.user-photo');
        if (this.userID) {
            photoItem.addEventListener('click', () => {navigateTo(`/profile/${this.userID}`)})
        }

        this.rootElement.appendChild(this.wrapper);
    }

    makeOnline() {
        if (this.wrapper) {
            this.wrapper.classList.add('online');
        }
    }

    makeOffline() {
        if (this.wrapper) {
            this.wrapper.classList.remove('online');
        }
    }


}