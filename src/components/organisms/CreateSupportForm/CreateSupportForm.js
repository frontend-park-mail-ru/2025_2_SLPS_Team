import CreateSupportTemplate from './CreateSupportForm.hbs';
import './CreateSupportForm.css';

import { ImageInput } from '../../molecules/ImageInput/ImageInput.js';
import BaseButton from '../../atoms/BaseButton/BaseButton.js';
import { NotificationManager } from '../NotificationsBlock/NotificationsManager.js';

const notifier = new NotificationManager();

export class CreateSupportForm {
    constructor(rootElement) {
        this.rootElement = rootElement;
        this.wrapper = null;
        this.input = null;
        this.outsideClickHandler = null;
    }

    async render() {
        this.wrapper = document.createElement('div');
        this.wrapper.id = 'support-form-wrapper';
        this.wrapper.innerHTML = CreateSupportTemplate();

        const inputContainer = this.wrapper.querySelector('.support-screenshot-block');
        this.input = new ImageInput(inputContainer);
        this.input.render();

        const buttonContainer = this.wrapper.querySelector('.support-actions__container');

        const cancelButton = new BaseButton(buttonContainer, {
            text: 'Отменить',
            style: 'default',
            onClick: () => this.close(),
        });
        await cancelButton.render();

        const submitButton = new BaseButton(buttonContainer, {
            text: 'Отправить обращение',
            style: 'primary',
            onClick: () => this.handleSubmit(),
        });
        await submitButton.render();

        this.rootElement.insertAdjacentElement('beforeend', this.wrapper);
    }

    open() {
        document.body.style.overflow = 'hidden';
        this.render();

        this.outsideClickHandler = (event) => {
            const modalContent = this.wrapper.querySelector('.support-container');
            if (modalContent && !modalContent.contains(event.target)) {
                this.close();
            }
        };

        document.addEventListener('mousedown', this.outsideClickHandler);
    }

    close() {
        document.body.style.overflow = '';

        if (this.outsideClickHandler) {
            document.removeEventListener('mousedown', this.outsideClickHandler);
            this.outsideClickHandler = null;
        }

        if (this.wrapper) {
            this.wrapper.remove();
            this.wrapper = null;
        }
    }

    async handleSubmit() {
        try {
            const loginEmailInput = this.wrapper.querySelector('.support-email-input');
            const topicSelect = this.wrapper.querySelector('.support-topic-select');
            const descriptionInput = this.wrapper.querySelector('.support-description-input');
            const nameInput = this.wrapper.querySelector('.support-name-input');
            const contactEmailInput = this.wrapper.querySelector('.support-contact-email-input');

            const loginEmail = loginEmailInput?.value.trim();
            const topic = topicSelect?.value.trim();
            const description = descriptionInput?.value.trim();
            const name = nameInput?.value.trim();
            const contactEmail = contactEmailInput?.value.trim();

            if (!loginEmail || !topic || !description || !name || !contactEmail) {
                notifier.show(
                    'Заполните все поля',
                    'Все поля формы обязательны для заполнения',
                    'error'
                );
                return;
            }

            const formData = new FormData();
            formData.append('login_email', loginEmail);
            formData.append('topic', topic);
            formData.append('description', description);
            formData.append('name', name);
            formData.append('contact_email', contactEmail);

            if (this.input && this.input.selectedFiles && this.input.selectedFiles.length > 0) {
                this.input.selectedFiles.forEach((file) => {
                    formData.append('screenshots', file);
                });
            }

            const res = await fetch(`${process.env.API_BASE_URL}/api/support`, {
                method: 'POST',
                body: formData,
                credentials: 'include',
            });

            if (!res.ok) {
                notifier.show(
                    'Ошибка',
                    'Не удалось отправить обращение. Попробуйте снова.',
                    'error'
                );
                return;
            }

            notifier.show(
                'Обращение отправлено',
                'Мы получили ваше обращение и скоро свяжемся с вами.',
                'success'
            );

            this.close();
        } catch (error) {
            console.error(error);
            notifier.show(
                'Ошибка',
                'Не удалось отправить обращение. Попробуйте снова.',
                'error'
            );
        }
    }
}
