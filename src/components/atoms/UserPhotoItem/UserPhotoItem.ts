import { navigateTo } from '../../../index';
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
        const photoPath = this.getPhotoPath(this.photoPath);

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

    getPhotoPath(photoPath?: string | null): string {
    if (!photoPath || photoPath === 'null') {
        return '/public/globalImages/DefaultAvatar.svg';
    }

    if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
        return photoPath;
    }

    if (photoPath.startsWith('/public/globalImages/')) {
        return photoPath;
    }

    return `${process.env.API_BASE_URL}/uploads/${photoPath}`;
    }
}
