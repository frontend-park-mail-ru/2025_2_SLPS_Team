import ApplicationModalTemplate from './ApplicationModal.hbs';
import './ApplicationModal.css';

import SelectInput from '../../atoms/SelectInput/SelectInput.js';
import { NotificationManager } from '../NotificationsBlock/NotificationsManager.js';
import BaseButton from '../../atoms/BaseButton/BaseButton.ts';

const notifier = new NotificationManager();

export class ApplicationModal {
    constructor(rootElement, applicationData) {
        this.rootElement = rootElement;
        this.data = applicationData;
        this.wrapper = null;
        this.outsideClickHandler = null;
    }

    async render() {
        this.wrapper = document.createElement('div');
        this.wrapper.innerHTML = ApplicationModalTemplate();

        const container = this.wrapper.querySelector('.application-container');

        container.querySelector('.user-first-name').textContent = `${this.data.full_name}`;
        container.querySelector('.user-email').textContent = this.data.emailFeedBack;
        container.querySelector('.user-topic').textContent = this.data.topic;
        container.querySelector('.user-description').textContent = this.data.text;

        const imgBox = container.querySelector('.application-images');
        if (this.data.images?.length) {
            this.data.images.forEach(src => {
                const div = document.createElement('div');
                div.classList.add('application-image-item');

                const img = document.createElement('img');
                img.src = src;

                div.appendChild(img);
                imgBox.appendChild(div);
            });
        }

        const viewer = this.wrapper.querySelector('.image-viewer');
        const viewerImg = viewer.querySelector('.image-viewer-img');

        imgBox.querySelectorAll('img').forEach(img => {
            img.addEventListener('click', () => {
                viewerImg.src = img.src;
                viewer.classList.remove('hidden');
            });
        });

        viewer.addEventListener('click', () => {
            viewer.classList.add('hidden');
            viewerImg.src = '';
        });


        this.statusSelect = new SelectInput(
            container.querySelector('.application-status-select'),
            {
                header: 'Статус',
                values: [
                    { label: 'Открыто', value: 'Открыто', active: true},
                    { label: 'В работе', value: 'В работе', active: false},
                    { label: 'Закрыто', value: 'Закрыто', active: false},
                    { label: 'Отменено', value: 'Отменено', active: false }
                ]
            }
        );
        await this.statusSelect.render();

        const buttonContainer = this.wrapper.querySelector('.application-actions');
        
        const NotSavebutton = new BaseButton(buttonContainer, {
            text: 'Отменить',
            style: 'default',
            onClick: () => {
            this.close();
            },
        });
        await NotSavebutton.render();
    
        const Savebutton = new BaseButton(buttonContainer, {
            text: 'Сохранить',
            style: 'primary',
            onClick: () => {
            this.save();
            this.close();
            },
        });
        await Savebutton.render();

        this.rootElement.appendChild(this.wrapper);
    }

    open() {
        document.body.style.overflow = 'hidden';
        this.render();

        this.outsideClickHandler = (event) => {
            const modal = this.wrapper.querySelector('.application-container');
            if (modal && !modal.contains(event.target)) {
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

    async save() {
        try {
            const status = this.statusSelect.getValue();

            const res = false;
            console.log('Тут обращаемся к api для изменения статуса заявки')

            if (!res.ok) {
                notifier.show('Ошибка', 'Не удалось сохранить изменения', 'error');
                return;
            }

            notifier.show('Успешно', 'Статус обновлён', 'success');

            this.close();
        } catch (err) {
            console.error(err);
            notifier.show('Ошибка', 'Не удалось сохранить изменения', 'error');
        }
    }
}
