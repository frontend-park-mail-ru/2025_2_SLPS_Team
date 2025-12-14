import dropDownTemplate from './dropDown.hbs';
import type { DropDownConfig } from '@shared/types/components.js';

export default class DropDown {
    container: HTMLElement;
    config: DropDownConfig;
    wrapper: HTMLElement | null;
    isVisible: boolean;
    constructor(container: HTMLElement, config: DropDownConfig) {
        this.container = container;
        this.config = {
            values: [],
            ...config,
        };

        this.wrapper = null;
        this.isVisible = false;
    }

    render(): void {
        const html = dropDownTemplate({ ...this.config });

        const wrapper = document.createElement("div");
        wrapper.innerHTML = html;
        this.wrapper = wrapper.firstElementChild  as HTMLElement;

        this.wrapper.style.display = "none";

        this.container.appendChild(this.wrapper);

        this.addEvents();
    }

    addEvents(): void {
        if (!this.wrapper) return;

        this.wrapper.querySelectorAll('.dropdown-item').forEach((item, index) => {
            item.addEventListener("click", () => {
                const option = this.config.values?.[index];
                if (option && typeof option.onClick === "function") {
                    option.onClick(option);
                }
                this.hide();
            });
        });
    }

    show(): void {
        this.wrapper!.style.display = "block";
        this.isVisible = true;
    }

    hide(): void {
        this.wrapper!.style.display = "none";
        this.isVisible = false;
    }

    toggle(): void {
        this.isVisible ? this.hide() : this.show();
    }
}
