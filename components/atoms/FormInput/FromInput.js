export default class FormInput {
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
        const response = await fetch("./components/atoms/FormInput/FormInput.hbs");
        const templateSource = await response.text();
        const template = Handlebars.compile(templateSource);


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
