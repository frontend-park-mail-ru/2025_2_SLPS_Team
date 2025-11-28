import MessageTemplate from './Message.hbs';

export class Message {
    constructor(rootElement, messageData, isMine, isLastInGroup, withAnimation) {
        this.rootElement = rootElement;
        this.messageData = messageData;
        this.isMine = isMine;
        this.isLastInGroup = isLastInGroup;
        this.wrapper = null;
        this.withAnimation = withAnimation;
    }

    render(status = false) {
        const tempDiv = document.createElement('div');

        tempDiv.innerHTML = MessageTemplate({
            text: this.messageData.text,
            time: this.formatTime(this.messageData.created_at),
            isMine: this.isMine,
        });

        this.wrapper = tempDiv.firstElementChild;


        // container.querySelector(`[data-message-id="${id}"]`)
        if (this.messageData.id != null) {
            this.wrapper.dataset.messageId = this.messageData.id;
        }

        if (!this.withAnimation) {
            this.wrapper.classList.add('no-anim');
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

    formatTime(datetime) {
        if (!datetime) return '';
        const date = new Date(datetime);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
}
