import MessageTemplate from './Message.hbs';
import type { MessageData } from '@shared/types/components.js';
import emojiRegex from 'emoji-regex';

const regex = emojiRegex();

export class Message {
    wrapper: HTMLElement | null = null;

    constructor(
        public rootElement: HTMLElement,
        public messageData: MessageData,
        public isMine: boolean,
        public isLastInGroup: boolean,
        public withAnimation: boolean
    ) {}

    render(status = false): void {
        const tempDiv = document.createElement('div');

        tempDiv.innerHTML = MessageTemplate({
            text: this.messageData.text,
            time: this.formatTime(this.messageData.created_at),
            isMine: this.isMine,
        });

        this.wrapper = tempDiv.firstElementChild as HTMLElement;


        // container.querySelector(`[data-message-id="${id}"]`)
        if (this.messageData.id != null) {
            this.wrapper.dataset.messageId = String(this.messageData.id);
        }

        if (!this.withAnimation) {
            this.wrapper.classList.add('no-anim');
        }

        if (this.isSingleEmoji(this.messageData.text)) {
            const message = this.wrapper.querySelector('.message') as HTMLElement
            message.classList.add('emoji');
        }

        if (this.isLastInGroup) {
            if (this.isMine) {
                this.wrapper.classList.add('last-in-group');
            } else {
                this.wrapper.classList.add('last-not-mine');
            }
        }

        if (status) {
            this.rootElement.prepend(this.wrapper);
        } else {
            this.rootElement.appendChild(this.wrapper);
        }
    }

    private formatTime(datetime?: string | Date): string{
        if (!datetime) return '';
        const date = new Date(datetime);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    private isSingleEmoji(text: string): boolean {
        const t = text.trim();
        if (!t) return false;

        const matches = Array.from(t.matchAll(regex)).map(m => m[0]);
        return matches.length === 1 && matches[0] === t;
    }
}
