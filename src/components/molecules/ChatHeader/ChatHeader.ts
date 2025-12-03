import ChatHeaderTemplate from './ChatHeader.hbs';
import { UserPhotoItem } from '../../atoms/UserPhotoItem/UserPhotoItem';

export class ChatHeader {
    wrapper: HTMLElement | null = null;
    avatarComponent: UserPhotoItem | null = null;

    constructor(
        public rootElement: HTMLElement,
        public name: string,
        public avatar: string,
        public hasBackButton: boolean,
        public onBack?: () => void
    ) {}

    render() {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = ChatHeaderTemplate({
            name: this.name,
            hasBackButton: this.hasBackButton
        });

        this.wrapper = tempDiv.firstElementChild as HTMLElement;

        const avatarContainer = this.wrapper.querySelector('.profile-avatar-container') as HTMLElement;
        this.avatarComponent = new UserPhotoItem(avatarContainer, this.avatar);
        this.avatarComponent.render();

        if (this.hasBackButton) {
            const backBtn = this.wrapper.querySelector('.chat-back-btn');
            if (backBtn && this.onBack) {
                backBtn.addEventListener('click', this.onBack);
            }
        }

        this.rootElement.appendChild(this.wrapper);
    }
}
