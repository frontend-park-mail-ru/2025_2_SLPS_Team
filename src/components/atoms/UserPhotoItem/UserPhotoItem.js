import UserPhotoItemTemplate from './UserPhotoItem.hbs'

export class UserPhotoItem {
    constructor(rootElement, photoPath) {
        this.rootElement = rootElement;
        this.wrapper = null;
        this.photoPath = photoPath
    }

    render() {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = UserPhotoItemTemplate({ photoPath: this.photoPath });
        this.wrapper = tempDiv.firstElementChild;
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