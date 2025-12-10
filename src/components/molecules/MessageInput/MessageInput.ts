import MessageInputTemplate from './MessageInput.hbs'
import { EmojiMenu } from '../EmojiMenu/EmojiMenu';

export class MessageInput {
    rootElement: HTMLElement;
    wrapper!: HTMLElement;
    textarea!: HTMLTextAreaElement;
    sendButton!: HTMLButtonElement;
    emojiPicker!: EmojiMenu;
    emojiBtn!: HTMLButtonElement;
    emojiRoot!: HTMLElement;

    constructor(rootElement: HTMLElement) {
        this.rootElement = rootElement;
    }

    render(): void {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = MessageInputTemplate({});
        this.wrapper = tempDiv.firstElementChild as HTMLElement;

        this.textarea = this.wrapper.querySelector('.input-message') as HTMLTextAreaElement;

        this.textarea.addEventListener('input', () => {
        this.textarea.style.height = 'auto';
        this.textarea.style.height = Math.min(this.textarea.scrollHeight, 120) + 'px';
        });

        this.sendButton = this.wrapper.querySelector('.message-send-btn') as HTMLButtonElement;

        this.emojiBtn = this.wrapper.querySelector('.emoji-btn')!;
        this.emojiRoot = this.wrapper.querySelector('.emoji-picker')!;

        this.emojiPicker = new EmojiMenu(
            this.wrapper,
            (emoji) => this.insertEmoji(emoji)
        );

        console.log(this.wrapper);

        this.emojiPicker.render();

        this.emojiBtn.addEventListener('click', () => {
            this.emojiPicker.toggle();
        });

        document.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;

        const clickedInsidePicker = this.wrapper.contains(target);
        const clickedEmojiBtn = this.emojiBtn.contains(target);

        if (!clickedInsidePicker && !clickedEmojiBtn) {
            this.emojiPicker.hide();
        }
    });


        this.rootElement.appendChild(this.wrapper);
    }


    getValue(): string {
        return this.textarea ? this.textarea.value : '';
    }

    clear(): void {
        if (this.textarea) {
            this.textarea.value = '';
            this.textarea.style.height = '37px';
        }
    }

    insertEmoji(emoji: string) {
        const textarea = this.textarea;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        textarea.value =
            textarea.value.slice(0, start) +
            emoji +
            textarea.value.slice(end);

        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;

        textarea.dispatchEvent(new Event('input'));
    }


}