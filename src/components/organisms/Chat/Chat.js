import ChatTemplate from './Chat.hbs'
import { ChatHeader } from '../../molecules/ChatHeader/ChatHeader.js';
import { Message } from '../../atoms/Message/Message.js';
import { MessageInput } from '../../molecules/MessageInput/MessageInput.js';

import { wsService } from '../../../services/WebSocketService.js';


async function getChatMessages(chatId, limit = 20, offset = 0) {
    console.log(chatId);
    const response = await fetch(`${process.env.API_BASE_URL}/api/chats/${chatId}/messages?page=${1}`, {credentials: 'include'});
    if (!response.ok) {
        throw new Error(`Ошибка запроса: ${response.status}`);
    }
    const data = await response.json();

    const messages = (data.Messages || []).map(msg => ({
        id: msg.id,
        text: msg.text,
        created_at: msg.createdAt,
        User: {
            id: msg.authorID,
            full_name: data.Authors?.[msg.authorID]?.fullName || '',
            avatar: data.Authors?.[msg.authorID]?.avatarPath || ''
        }
    }));

    return messages;
}


export class Chat{
    constructor(rootElement, chatInfo, myUserId, myUserName, myUserAvatar) {
        this.rootElement = rootElement;
        this.chatInfo = chatInfo;
        this.myUserId = myUserId;
        this.myUserName = myUserName;
        this.myUserAvatar = myUserAvatar;
        this.messages = null;
        this.chatHeader = null;
        this.inputMes = null;
        this.messagesContainer = null;
        this.scrollButton = null;
        console.log(chatInfo);
    }

    async render() {
        const wrapper = document.createElement('div');
        console.log(this.chatInfo)
        wrapper.innerHTML = ChatTemplate(this.chatInfo);

        const mainContainer = wrapper.querySelector('.chat-container');

        this.chatHeader = new ChatHeader(mainContainer.querySelector('.chat-header-container'), this.chatInfo);
        this.chatHeader.render();

        this.messages = await getChatMessages(this.chatInfo);

        this.messagesContainer = mainContainer.querySelector('.chat-messeges');
        this.messages.forEach((messageData, index) => {
            const isMine = messageData.User.id === this.myUserId;

            const nextMessage = this.messages[index + 1];
            const isLastInGroup =
                !nextMessage || nextMessage.User.id !== messageData.User.id;

            const withAnimation = false;

            const message = new Message(
                this.messagesContainer,
                messageData,
                isMine,
                isLastInGroup,
                withAnimation
            );
            message.render();
        });

        this.inputMes = new MessageInput(mainContainer.querySelector('.messege-input'));
        this.inputMes.render();

        this.inputMes.textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                this.sendEvent(e);
            }
        });

        this.inputMes.sendButton.addEventListener('click', (e) => {this.sendEvent(e);});

        wsService.on('message', (data) => {
            console.log(data);
            const messageData = data;
            const message = new Message(this.messagesContainer, messageData, false, false, true);
            message.render();

            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        });

        this.addScrollButton();

        this.rootElement.appendChild(wrapper.firstElementChild);

        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight - this.messagesContainer.clientHeight;
    }

    addScrollButton() {
        this.scrollButton = this.messagesContainer.querySelector('.scroll-to-bottom-btn');

        this.messagesContainer.addEventListener('scroll', () => {
            const maxScroll = this.messagesContainer.scrollHeight - this.messagesContainer.clientHeight;
            const isAtBottom = this.messagesContainer.scrollTop >= (maxScroll - 200);

            if (isAtBottom) {
                this.scrollButton.classList.remove('visible');
            } else {
                this.scrollButton.classList.add('visible');
            }
        });

        this.scrollButton.addEventListener('click', () => {
            const el = this.messagesContainer;
            const smoothPart = 700;

            const maxScroll = el.scrollHeight - el.clientHeight;

            el.scrollTop = maxScroll - smoothPart;

            setTimeout(() => {
                el.scrollTo({
                    top: maxScroll,
                    behavior: 'smooth'
                });
            }, 20);
        });

    }


    async sendEvent(e) {
        e.preventDefault();
        const text = this.inputMes.getValue();
        if (!text) return;

        const chatID = this.chatInfo;
        const messageBody = {
            text
        };

        try {
            const response = await fetch(`${process.env.API_BASE_URL}/api/chats/${chatID}/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(messageBody)
            });

            if (!response.ok) {
                throw new Error(`Ошибка отправки: ${response.status}`);
            }

            const data = await response.json();
            const message = {
                id: data.id,
                text,
                created_at: new Date().toISOString(),
                User: {
                    id: this.myUserId,
                    full_name: this.myUserName,
                    avatar: this.myUserAvatar
                }
            };

            new Message(this.messagesContainer, message, true).render();
            this.inputMes.clear();

        } catch (err) {
            console.error('Ошибка при отправке сообщения:', err);
        }
    }

}
