import BaseButtonTemplate from './BaseButton.hbs';

export default class BaseButton {
    constructor(container, config) {
        this.container = container;
        this.config = {
            text: "",
            style: "",
            onClick: null,
            ...config,
        };

        this.wrapper = null;
        this.button = null;
    }

    async render() {
        const html = BaseButtonTemplate({ ...this.config });

        const wrapper = document.createElement("div");
        wrapper.innerHTML = html;
        this.wrapper = wrapper.firstElementChild;

        this.button = this.wrapper;
        console.log(this.button)
        console.log(this.container)
        console.log(this.config.onClick)
        

        if (typeof this.config.onClick === 'function') {
            this.button.addEventListener('click', this.config.onClick);
        }

        this.container.appendChild(this.wrapper);
    }
}
