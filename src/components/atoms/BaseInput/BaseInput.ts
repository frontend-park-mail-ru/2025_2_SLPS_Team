import BaseInputTemplate from "./BaseInput.hbs"
import type { BaseInputConfig } from "@shared/types/components.js";

/**
 * @module BaseInput
 */
/**
 * Класс для создания базовых input полей.
 */
export default class BaseInput {
    container: HTMLElement;
    config: any;
    wrapper: HTMLElement | null;
    input: HTMLInputElement | null;
    errorEl: HTMLElement | null;
    constructor(container: HTMLElement, config: BaseInputConfig) {
        this.container = container;
        this.config = {
            header: "aaa",
            type: "text",
            placeholder: "",
            autocomplete: "off",
            maxLength: 256,
            required: false,
            value: "",
            isBig: false,
            ...config,
        };

        this.wrapper = null;
        this.input = null;
        this.errorEl = null;
    }

    async render() {
        const template = BaseInputTemplate;
        const html = template({...this.config});

        const wrapper = document.createElement("div");
        wrapper.innerHTML = html;
        this.wrapper = wrapper.firstElementChild as HTMLElement;

        this.input = this.wrapper.querySelector(".baseinput-field") as HTMLInputElement;
        this.input.value = this.config.value || ""; 

        if (this.config.maxLength) {
            const counter = this.wrapper.querySelector(".input-counter") as HTMLElement | null;
            if (counter) {
                this.input.addEventListener("input", () => {
                    counter.textContent = String(this.config.maxLength - this.input!.value.length);
                });
            }
        }

        this.container.appendChild(this.wrapper);
    }

    showError(): void {
        this.input?.classList.add("invalid");
    }

    hideError(): void {
        this.input!.classList.remove("invalid");
    }

    getValue() {
        return this.input!.value;
    }
}
