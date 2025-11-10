import MessageInputTemplate from './MessageInput.hbs'

export class MessageInput {
    constructor(rootElement) {
        this.rootElement = rootElement;
        this.textarea = null
        this.sendButton = null;
    }

    render() {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = MessageInputTemplate();
        this.wrapper = tempDiv.firstElementChild;

        this.textarea = this.wrapper.querySelector('.input-message');

        this.textarea.addEventListener('input', () => {
        this.textarea.style.height = 'auto';
        this.textarea.style.height = Math.min(this.textarea.scrollHeight, 120) + 'px';
        });

        this.sendButton = this.wrapper.querySelector('.message-send-btn')


        this.rootElement.appendChild(this.wrapper);
    }


    getValue() {
        return this.textarea ? this.textarea.value : '';
    }

    clear() {
        if (this.textarea) {
            this.textarea.value = '';
            this.textarea.style.height = '37px';
        }
    }

}