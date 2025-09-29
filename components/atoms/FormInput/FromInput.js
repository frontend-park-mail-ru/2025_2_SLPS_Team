/**
 * @module FormInput
 */
/**
 * Класс для создания input полей формы.
 */
export default class FormInput {
    /**
     * Создаёт новый input.
     * @param {HTMLElement} container - Контейнер, куда будет добавлен input.
     * @param {Object} config - Конфигурация input.
     * @param {string} [config.type="text"] - Тип input (text, password и т.д.).
     * @param {string} [config.placeholder=""] - Placeholder для input.
     * @param {string} [config.autocomplete="off"] - Атрибут autocomplete.
     * @param {number} [config.maxLength=256] - Максимальная длина текста.
     * @param {boolean} [config.required=false] - Обязательность заполнения.
     * @param {string} [config.value=""] - Начальное значение input.
     * @param {string} [config.name] - Имя input, используется в getValue().
     * @param {string} [config.validation] - Тип валидации, например "email".
     */
    constructor(container, config) {
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
        this.input = null;
        this.errorEl = null;
    }

    async render() {
        const template = Handlebars.templates['FormInput.hbs'];
        const html = template({
            ...this.config,
            isPassword: this.config.type === "password"
        });

        const wrapper = document.createElement("div");
        wrapper.innerHTML = html;
        this.wrapper = wrapper.firstElementChild;

        this.input = this.wrapper.querySelector("input");
        this.input.value = this.config.value || ""; 
        this.floatingLabel = this.wrapper.querySelector(".input-floating-label");

        if (this.config.validation === "email") {
            this.input.type = "text";
        }

        if (this.config.type === "password") {
            const toggle = this.wrapper.querySelector(".pwd-control");
            toggle.addEventListener("click", () => {
                if (this.input.type === "password") {
                    this.input.type = "text";
                    toggle.classList.add("show");
                } else {
                    this.input.type = "password";
                    toggle.classList.remove("show");
                }
            });
        }

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

    showError(message) {
        this.input.classList.add("invalid");
        if (this.floatingLabel) {
            this.floatingLabel.textContent = message;
            this.floatingLabel.style.display = "block";
        }
    }

    hideError() {
        this.input.classList.remove("invalid");
        if (this.floatingLabel) {
            this.floatingLabel.textContent = this.config.label || "";
        }
    }

    getValue() {
        return { [this.config.name]: this.input.value };
    }
}
