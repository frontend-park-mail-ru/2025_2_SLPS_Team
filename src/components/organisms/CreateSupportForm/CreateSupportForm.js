import CreateSupportTemplate from './CreateSupportForm.hbs';
import './CreateSupportForm.css';

import BaseButton from '../../atoms/BaseButton/BaseButton.js';
import { NotificationManager } from '../NotificationsBlock/NotificationsManager.js';
import SelectInput from '../../atoms/SelectInput/SelectInput.js';
import BaseInput from '../../atoms/BaseInput/BaseInput.js';
import { ImageInputSmall } from '../../molecules/InputImageSmall/InputImageSmall.js';
import { createSupportRequest } from '../../../shared/api/helpApi.js';


const notifier = new NotificationManager();

const CATEGORY_MAP = {
    'Приложение зависает/тормозит': 'app_freezing',
    'Не загружается страница': 'page_not_loading',
    'Не работает чат': 'chat_not_working',
    'Не работает профиль': 'profile_not_working',
    'Не работает мессенджер': 'messenger_not_working',
    'Не работает страница друзья': 'friend_not_working',
    'Проблема с авторизацией/входом': 'auth_problem',
};

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

        this.inputs.regEmail = new BaseInput(
            this.wrapper.querySelector('.reg-email-input'),
            {
                header: 'С какой почтой вы вошли?',
                type: 'text',
                placeholder: 'exampl@email.com',
                required: true,
            },
        );
        await this.inputs.regEmail.render();

        this.inputs.supportSelect = new SelectInput(
            this.wrapper.querySelector('.support-select-wrapper'),
            {
                header: 'С чем связано ваше обращние?',
                values: [
                    { label: 'Приложение зависает/тормозит', value: 'Приложение зависает/тормозит', active: false },
                    { label: 'Не загружается страница', value: 'Не загружается страница', active: false },
                    { label: 'Не работает чат', value: 'Не работает чат', active: false },
                    { label: 'Не работает профиль', value: 'Не работает профиль', active: false },
                    { label: 'Не работает мессенджер', value: 'Не работает мессенджер', active: false },
                    { label: 'Не работает страница друзья', value: 'Не работает страница друзья', active: false },
                    { label: 'Проблема с авторизацией/входом', value: 'Проблема с авторизацией/входом', active: false },
                    { label: 'Не выбрано', value: 'Не выбрано', active: true },
                ],
            },
        );
        await this.inputs.supportSelect.render();

        this.inputs.aboutProblem = new BaseInput(
            this.wrapper.querySelector('.about-problem-input'),
            {
                header: 'Опишите проблему как можно подробнее',
                type: 'text',
                placeholder: 'Тут описание вашей проблемы',
                required: true,
                isBig: true,
            },
        );
        await this.inputs.aboutProblem.render();

        new ImageInputSmall(
        this.wrapper.querySelector('.support-screenshot-block'),
        'Фото 1'
        ).render();

        new ImageInputSmall(
        this.wrapper.querySelector('.support-screenshot-block'),
        'Фото 2'
        ).render();

        new ImageInputSmall(
        this.wrapper.querySelector('.support-screenshot-block'),
        'Фото 3'
        ).render();

        this.inputs.nameInput = new BaseInput(
            this.wrapper.querySelector('.support-contacts-name'),
            {
                header: 'Имя и Фамилия',
                type: 'text',
                placeholder: 'Укажите как мы можем к вам обращаться',
                required: true,
            },
        );
        await this.inputs.nameInput.render();

        this.inputs.emailInput = new BaseInput(
            this.wrapper.querySelector('.support-contacts-email'),
            {
                header: 'Почта для связи',
                type: 'text',
                placeholder: 'example@email.com',
                required: true,
            },
        );
        await this.inputs.emailInput.render();

        const buttonContainer = this.wrapper.querySelector('.support-actions__container');

        const cancelButton = new BaseButton(buttonContainer, {
            text: 'Отменить',
            style: 'default',
            onClick: () => this.handleCancel(),
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

    handleCancel() {
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'support-widget:close' }, '*');
        }
    }

    async handleSubmit() {
        const loginEmailInput = this.wrapper.querySelector('.support-email-input');
        const topicSelect = this.wrapper.querySelector('.support-topic-select');
        const descriptionInput = this.wrapper.querySelector('.support-description-input');
        const nameInput = this.wrapper.querySelector('.support-name-input');
        const contactEmailInput = this.wrapper.querySelector('.support-contact-email-input');

        const loginEmail = this.inputs.regEmail.getValue();
        const topicLabel = this.inputs.supportSelect.getValue();
        const topic = CATEGORY_MAP[topicLabel];
        const description = this.inputs.aboutProblem.getValue();
        const name = this.inputs.nameInput.getValue();
        const contactEmail = this.inputs.emailInput.getValue();

        this.wrapper
        .querySelectorAll('.support-input-error')
        .forEach((el) => el.classList.remove('support-input-error'));

        let hasError = false;
        const markError = (el) => {
        if (!el) return;
        el.classList.add('support-input-error');
        hasError = true;
        };

        if (!loginEmail) markError(loginEmailInput);
        if (!topic || topic === 'none' || topic === 'Не выбрано') markError(topicSelect);
        if (!description) markError(descriptionInput);
        if (!name) markError(nameInput);
        if (!contactEmail) markError(contactEmailInput);

        if (hasError) {
        notifier.show(
            'Заполните все поля',
            'Все поля формы обязательны для заполнения',
            'error',
        );
        return;
        }

        const now = new Date().toISOString();

        const images = this.inputs.imageInput.getImages();
        const base64Images = [];
        for (const file of images) {
            const base64 = await this.fileToBase64(file);
            base64Images.push(base64);
        }


        const payload = {
        authorID: 'temp',
        category: topic,
        createdAt: now,
        emailFeedBack: contactEmail,
        emailReg: loginEmail,
        fullName: name,
        id: 0,
        status: 'open',
        text: description,
        updatedAt: now,
        images: base64Images,
        };

        console.log('[SUPPORT PAYLOAD]', payload);

        try {
        await createSupportRequest(payload);

        notifier.show(
            'Обращение отправлено',
            'Мы получили ваше обращение и скоро свяжемся с вами.',
            'success',
        );

        if (window.parent && window.parent !== window) {
            window.parent.postMessage(
            { type: 'support-widget:submitted' },
            '*',
            );
        }
        } catch (err) {
        console.error(
            '[Support] create application failed:',
            err.status,
            err.data || err,
        );

        notifier.show(
            'Ошибка',
            'Не удалось отправить обращение. Попробуйте снова.',
            'error',
        );
        }
    }


    fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
}