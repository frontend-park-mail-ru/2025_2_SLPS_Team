import CreatePostTemplate from './CreatePost.hbs';
import {ImageInput} from '../../molecules/ImageInput/ImageInput.js'
import BaseButton from '../../atoms/BaseButton/BaseButton.js';
import { NotificationManager } from '../NotificationsBlock/NotificationsManager.js';

const notifier = new NotificationManager();

export class CreatePostForm {
    constructor(rootElement, profileData, mode = "create", postData = null) {
        this.rootElement = rootElement;
        this.user_id = profileData;
        this.wrapper = null;
        this.input = null;
        this.mode = mode;
        this.postData = postData;
    }

    async render() {
        this.wrapper = document.createElement('div');
        this.wrapper.id = 'new-post-wrapper';
        this.wrapper.innerHTML = CreatePostTemplate();
        const textInput = this.wrapper.querySelector('.post-text__input');

        if (this.mode === 'edit') {
            this.wrapper.querySelector('.new-post__header').textContent = 'Редактирование поста';
        } 

        if (this.mode === "edit" && this.postData) {
            textInput.value = this.postData.post.text || "";

            const inputContainer = this.wrapper.querySelector('.input-image__block');
            this.input = new ImageInput(inputContainer);
            this.input.render();

            if (this.postData.post.photos && this.postData.post.photos.length > 0) {
                this.input.displayExistingImages(this.postData.post.photos);
            }
        } else {
            const inputContainer = this.wrapper.querySelector('.input-image__block');
            this.input = new ImageInput(inputContainer);
            this.input.render();
        }

        const buttonContainer = this.wrapper.querySelector('.new-post-actions__container');

        const cancelButton = new BaseButton(buttonContainer, {
            text: "Отменить",
            style: "default",
            onClick: () => this.close(),
        });
        await cancelButton.render();

        const mainButton = new BaseButton(buttonContainer, {
            text: this.mode === "edit" ? "Сохранить изменения" : "Создать пост",
            style: "primary",
            onClick: () => {
                this.mode === "edit" ? this.updatePost() : this.saveData();
                this.close();
            }
        });
        await mainButton.render();

        this.rootElement.insertAdjacentElement('beforeend', this.wrapper);
    }


    open() {
        document.body.style.overflow = "hidden";
        this.render();

        this.outsideClickHandler = (event) => {
            const modalContent = this.wrapper.querySelector('.new-post-container');

            if (modalContent && !modalContent.contains(event.target)) {
                this.close();
            }
        };
        
        document.addEventListener('mousedown', this.outsideClickHandler);
    }

    close() {
        document.body.style.overflow = "";
        console.log('Close called');
        
        if (this.outsideClickHandler) {
            document.removeEventListener('mousedown', this.outsideClickHandler);
            this.outsideClickHandler = null;
        }
        
        if (this.wrapper) {
            this.wrapper.remove();
            this.wrapper = null;
        }
    }

    async saveData() {
        console.log('Получение данных из формы и отправка запроса на создание поста');

        try {
            const textInput = this.wrapper.querySelector('.post-text__input');
            const text = textInput?.value?.trim();

            const formData = new FormData();
            formData.append('text', text);

            if (this.input && this.input.selectedFiles && this.input.selectedFiles.length > 0) {
                this.input.selectedFiles.forEach(file => formData.append('photos', file));
            }

            console.log(formData);

            const res = await fetch(`${process.env.API_BASE_URL}/api/posts`, {
                method: 'POST',
                body: formData,
                credentials: "include",
            });

            if (res.ok) {
                notifier.show('Пост Создан', "Вы создали пост, можете посмотреть его в проифле", 'success')
            }

        } catch (error) {
            notifier.show('Ошибка', 'Не удалось создать пост. Попробуйте снова.', 'error');
        }
    }

    async updatePost() {
        try {
            const textInput = this.wrapper.querySelector('.post-text__input');
            const text = textInput?.value?.trim();

            const formData = new FormData();
            formData.append('text', text);

            if (this.input && this.input.selectedFiles && this.input.selectedFiles.length > 0) {
                for (let file of this.input.selectedFiles) {
                    if (file instanceof File) {
                        formData.append('attachments', file);
                    } else if (file.url) {
                        const response = await fetch(file.url);
                        const blob = await response.blob();
                        const filename = file.url.split('/').pop();
                        const newFile = new File([blob], filename, { type: blob.type });
                        formData.append('attachments', newFile);
                    }
                }
            }

            const res = await fetch(`${process.env.API_BASE_URL}/api/posts/${this.postData.id}`, {
                method: 'PUT',
                body: formData,
                credentials: 'include',
            });

            if (!res.ok) throw new Error(`Ошибка ${res.status}`);

            const data = await res.json();
            notifier.show('Пост изменён', 'Изменения успешно сохранены', 'success');

        } catch (error) {
            console.error(error);
            notifier.show('Ошибка', 'Не удалось изменить пост. Попробуйте снова.', 'error');
        }
    }

}
