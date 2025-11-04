import BaseInputTemplate from "./BaseInput.hbs"

/**
 * @module BaseInput
 */
/**
 * Класс для создания базовых input полей.
 */
export default class BaseInput {
    constructor(container, config) {
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
        this.wrapper = wrapper.firstElementChild;

        this.input = this.wrapper.querySelector(".baseinput-field");
        this.input.value = this.config.value || ""; 

        if (this.config.maxLength) {
            const counter = this.wrapper.querySelector(".input-counter");
            if (counter) {
                this.input.addEventListener("input", () => {
                    counter.textContent = this.config.maxLength - this.input.value.length;
                });
            }
        }

        this.container.appendChild(this.wrapper);
    }

    showError() {
        this.input.classList.add("invalid");
    }

    hideError() {
        this.input.classList.remove("invalid");
    }

    getValue() {
        return { [this.config.name]: this.input.value };
    }
}
