import CreatePostTemplate from './CreatePost.hbs';
import {ImageInput} from '../../molecules/ImageInput/ImageInput.js'
import BaseButton from '../../atoms/BaseButton/BaseButton.js';

export class CreatePostForm {
    constructor(rootElement, profileData) {
        this.rootElement = rootElement;
        this.user_id = profileData;
        this.wrapper = null;
        this.input = null;
    }

    async render() {
        console.log(this.profileData);
        this.wrapper = document.createElement('div');
        this.wrapper.id = 'new-post-wrapper';
        this.wrapper.innerHTML = CreatePostTemplate();

        const inputContainer = this.wrapper.querySelector('.input-image__block')
        console.log(inputContainer);
        this.input = new ImageInput(inputContainer);
        this.input.render();


        const buttonContainer = this.wrapper.querySelector('.new-post-actions__container');

        const NotSavebutton = new BaseButton(buttonContainer, {
            text: "Отменить",
            style: "default",
            onClick: () => {
                this.close();
            }
        });
        await NotSavebutton.render();

        const Savebutton = new BaseButton(buttonContainer, {
            text: "Создать Пост",
            style: "primary",
            onClick: () => {
                this.saveData();
                this.close();
            }
        });
        await Savebutton.render();

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

    async saveData (){
        console.log('Полечение данных из формы и отправка запроса на создание поста');
    }
}
