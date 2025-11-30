import BaseButtonTemplate from './BaseButton.hbs';

export default class BaseButton {
    container: HTMLElement;
    config: any;
    wrapper: HTMLElement | null;
    button: HTMLButtonElement | null;
    constructor(container: HTMLElement, config: any) {
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

    async render(): Promise<void> {
        const html = BaseButtonTemplate({ ...this.config });

        const wrapper = document.createElement("div");
        wrapper.innerHTML = html;
        this.wrapper = wrapper.firstElementChild as HTMLElement;

        this.button = this.wrapper as HTMLButtonElement | null;
        
        if (typeof this.config.onClick === 'function') {
            this.button!.addEventListener('click', this.config.onClick);
        }

        this.container.appendChild(this.wrapper);
    }
}
