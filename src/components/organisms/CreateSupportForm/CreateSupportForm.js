import CreateSupportTemplate from './CreateSupportForm.hbs';
import './CreateSupportForm.css';

import BaseButton from '../../atoms/BaseButton/BaseButton.js';
import { NotificationManager } from '../NotificationsBlock/NotificationsManager.js';
import SelectInput from '../../atoms/SelectInput/SelectInput.js';
import BaseInput from '../../atoms/BaseInput/BaseInput.js';
import { ImageInputSmall } from '../../molecules/InputImageSmall/InputImageSmall.js';

const notifier = new NotificationManager();

export class CreateSupportForm {
    constructor(rootElement) {
        this.rootElement = rootElement;
        this.wrapper = null;
        this.input = null;
        this.outsideClickHandler = null;
        this.inputs = {};
    }

    async render() {
        this.wrapper = document.createElement('div');
        this.wrapper.id = 'support-form-wrapper';
        this.wrapper.innerHTML = CreateSupportTemplate();

        this.inputs.regEmail = new BaseInput(this.wrapper.querySelector('.reg-email-input'), {
              header: 'С какой почтой вы вошли?',
              type: 'text',
              placeholder: 'exampl@email.com',
              required: true,
            });
        await this.inputs.regEmail.render();

        this.inputs.supportSelect = new SelectInput(this.wrapper.querySelector('.support-select-wrapper'), {
              header: 'С чем связано ваше обращние?',
              values: [
                { label: 'Приложение зависает/тормозит', value: 'none', active: false },
                { label: 'Не загружается страница', value: 'none', active: false },
                { label: 'Не рабоатет чат', value: 'none', active: false },
                { label: 'Не рабоатет профиль', value: 'none', active: false },
                { label: 'Не рабоатет мессенджер', value: 'none', active: false },
                { label: 'Не рабоатет страница друзья', value: 'none', active: false },
                { label: 'Проблема с авторизацией/входом', value: 'none', active: false },
                { label: 'Не выбрано', value: 'Не выбрано', active: true },
              ],
            });
        await this.inputs.supportSelect.render();

        this.inputs.aboutProblem = new BaseInput(this.wrapper.querySelector('.about-problem-input'), {
              header: 'Опишите проблему как можно подробнее',
              type: 'text',
              placeholder: 'Тут описание вашей проблемы',
              required: true,
              isBig: true,
            });
        await this.inputs.aboutProblem.render(); 

        this.inputs.imageInput = new ImageInputSmall(this.wrapper.querySelector('.support-screenshot-block'));
        this.inputs.imageInput.render();

        this.inputs.nameInput = new BaseInput(this.wrapper.querySelector('.support-contacts-name'), {
              header: 'Имя и Фамилия',
              type: 'text',
              placeholder: 'Укажите как мы можем к вам обращаться',
              required: true,
            });
        await this.inputs.nameInput.render(); 

        this.inputs.emailInput = new BaseInput(this.wrapper.querySelector('.support-contacts-email'), {
              header: 'Почта для связи',
              type: 'text',
              placeholder: 'example@email.com',
              required: true,
            });
        await this.inputs.emailInput.render(); 

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
