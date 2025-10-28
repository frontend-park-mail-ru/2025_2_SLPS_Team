import ChatTemplate from './Chat.hbs'
import { ChatHeader } from '../../molecules/ChatHeader/ChatHeader.js';
import { Message } from '../../atoms/Message/Message.js';
import { MessageInput } from '../../molecules/MessageInput/MessageInput.js';

import { wsService } from '../../../services/WebSocketService.js';


async function getChatMessages(chatId) {
    const response = await fetch(`${process.env.API_BASE_URL}/api/chat/${chatId}`);
    if (!response.ok) {
        throw new Error(`Ошибка запроса: ${response.status}`);
    }
    const data = await response.json();
    return data.messages;
}


export class Chat{
    constructor(rootElement, chatInfo, myUserId) {
        this.rootElement = rootElement;
        this.chatInfo = chatInfo;
        this.messages = null;
        this.chatHeader = null;
        this.myUserId = myUserId;
        this.inputMes = null;
        this.messagesContainer = null;
        this.scrollButton = null;
    }

    async render() {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = ChatTemplate(this.chatInfo);

        const mainContainer = wrapper.querySelector('.chat-container');

        this.chatHeader = new ChatHeader(mainContainer.querySelector('.chat-header-container'), this.chatInfo);
        this.chatHeader.render();

        this.messages = await getChatMessages(this.chatInfo.id);

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


    sendEvent(e) {
        e.preventDefault();
        const text = this.inputMes.getValue();
        if (text) {
            const message = {
                text,
                created_at: new Date().toISOString(),
                chatId: this.chatInfo.id,
                User: {
                    id: this.myUserId,
                    full_name: 'Павловский Роман',
                    avatar: '/public/testData/Avatar.jpg'
                }
            };
            wsService.send('message', message);
            new Message(this.messagesContainer, message, true).render();
            this.inputMes.clear();
        }
    }
}