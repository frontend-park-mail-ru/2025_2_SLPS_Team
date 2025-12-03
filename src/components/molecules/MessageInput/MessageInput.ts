import MessageInputTemplate from './MessageInput.hbs'

export class MessageInput {
    rootElement: HTMLElement;
    wrapper!: HTMLElement;
    textarea!: HTMLTextAreaElement;
    sendButton!: HTMLButtonElement;

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

}