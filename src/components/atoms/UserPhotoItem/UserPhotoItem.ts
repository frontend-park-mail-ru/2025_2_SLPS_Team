import { navigateTo } from '../../../index.js';
import UserPhotoItemTemplate from './UserPhotoItem.hbs';

export class UserPhotoItem {
    wrapper: HTMLElement | null = null;

    constructor(
        public rootElement: HTMLElement,
        public photoPath: string | null | undefined,
        public userID?: number
    ) {}

    render(): void {
        const tempDiv = document.createElement('div');
        console.log(this.photoPath);
        const photoPath: string =
            this.photoPath !== undefined && this.photoPath !== null && this.photoPath !== '' && this.photoPath !== 'null'
                ? `${process.env.API_BASE_URL}/uploads/${this.photoPath}`
                : '/public/globalImages/DefaultAvatar.svg';

        tempDiv.innerHTML = UserPhotoItemTemplate({ photoPath });

        this.wrapper = tempDiv.firstElementChild as HTMLElement | null;
        if (!this.wrapper) return;

        const photoItem = this.wrapper.querySelector<HTMLElement>('.user-photo');
        if (photoItem && this.userID) {
            photoItem.addEventListener('click', () => navigateTo(`/profile/${this.userID}`));
        }

        this.rootElement.appendChild(this.wrapper);
    }

    makeOnline(): void {
        this.wrapper?.classList.add('online');
    }

    makeOffline(): void {
        this.wrapper?.classList.remove('online');
    }
}
