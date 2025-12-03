import FormInputTemplate from "./FormInput.hbs"
import type { FormInputConfig } from "@shared/types/components.js"

/**
 * @module FormInput
 */
/**
 * Класс для создания input полей формы.
 */
export default class FormInput {
    container: HTMLElement;
    config: FormInputConfig;
    wrapper: HTMLElement | null;
    input!: HTMLInputElement;
    errorEl: HTMLElement | null;
    floatingLabel: HTMLElement | null;

    constructor(container: HTMLElement, config: FormInputConfig) {
        this.container = container;
        this.config = {
            type: "text",
            placeholder: "",
            autocomplete: "off",
            maxLength: 256,
            required: false,
            value: "",
            ...config,
        };

        this.wrapper = null;
        this.errorEl = null;
        this.floatingLabel = null
    }

    async render(): Promise<void> {
        const template = FormInputTemplate;
        const html = template({
            ...this.config,
            isPassword: this.config.type === "password"
        });

        const wrapper = document.createElement("div");
        wrapper.innerHTML = html;
        this.wrapper = wrapper.firstElementChild as HTMLElement;

        this.input = this.wrapper.querySelector("input") as HTMLInputElement;
        this.input!.value = this.config.value || ""; 
        this.floatingLabel = this.wrapper.querySelector(".input-floating-label");

        if (this.config.validation === "email") {
            this.input!.type = "text";
        }

        if (this.config.type === "password") {
            const toggle = this.wrapper.querySelector(".pwd-control");
            toggle!.addEventListener("click", () => {
                if (this.input!.type === "password") {
                    this.input!.type = "text";
                    toggle!.classList.add("show");
                } else {
                    this.input!.type = "password";
                    toggle!.classList.remove("show");
                }
            });
        }

        if (this.config.maxLength) {
            const counter = this.wrapper.querySelector(".input-counter") as HTMLElement;
            if (counter) {
                this.input!.addEventListener("input", () => {
                    counter.textContent = String(this.config.maxLength! - this.input!.value.length);
                });
            }
        }

        this.container.appendChild(this.wrapper);
    }

    showError(message: string): void {
        if (this.input) this.input.classList.add("invalid");
        if (this.floatingLabel) {
            this.floatingLabel.textContent = message;
            this.floatingLabel.style.display = "block";
        }
    }

    hideError(): void {
        this.input!.classList.remove("invalid");
        if (this.floatingLabel) {
            this.floatingLabel.textContent = this.config.label || "";
        }
    }

    getValue() {
        return { [this.config.name || ""]: this.input?.value || "" };
    }
}
