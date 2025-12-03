import FormInput from "../../atoms/FormInput/FromInput";
import { renderFormButton } from "../../atoms/FormButtons/FormButtons";
import loginFormTemplate from "./LoginFrom.hbs";

/**
 * Модуль `LoginForm` предоставляет класс для создания и управления формой входа.
 * Использует Handlebars-шаблон `LoginForm.hbs`, а также компоненты `FormInput` и `renderFormButton`.
 * @module LoginForm
 */

/**
 * Класс, представляющий форму авторизации пользователя.
 */type LoginFormOptions = {
    onSubmit?: (data: { email: string; password: string; rememberMe: boolean }) => void;
    onReg?: () => void;
};

interface InputsMap {
    email?: FormInput;
    password?: FormInput;
}

export default class LoginForm {
    container: HTMLElement;
    options: LoginFormOptions;
    form: HTMLFormElement | null;
    inputs: InputsMap;

    constructor(container: HTMLElement, options: LoginFormOptions = {}) {
        this.container = container;
        this.options = options;
        this.form = null;
        this.inputs = {};
    }

    async render(): Promise<void> {
        const html = loginFormTemplate({});
        const wrapper = document.createElement("div");
        wrapper.innerHTML = html.trim();

        this.form = wrapper.querySelector("form");
        if (!this.form) return;

        this.container.appendChild(this.form);

        const inputContainer = this.form.querySelector('.input-container') as HTMLElement;
        const buttons = this.form.querySelector('.button-container') as HTMLElement;

        this.inputs.email = new FormInput(inputContainer, {
            name: "email",
            label: "Email",
            type: "text",
            placeholder: "Введите email",
            required: true,
            showRequired: true,
        });
        await this.inputs.email.render();

        this.inputs.password = new FormInput(inputContainer, {
            name: "password",
            label: "Пароль",
            type: "password",
            placeholder: "Введите пароль",
            required: true,
            showRequired: true,
        });
        await this.inputs.password.render();

        await renderFormButton(buttons, "submit", "Войти", "accent", (e: Event) => {
            e.preventDefault();
            this.handleSubmit();
        });

        await renderFormButton(buttons, "button", "Регистрация", "base", (e: Event) => {
            e.preventDefault();
            this.handleRegister();
        });
    }


    handleSubmit(): void {
        const { email, password, rememberMe } = this.getValues();
        this.options.onSubmit?.({ email, password, rememberMe });
    }

    handleRegister(): void {
        this.options.onReg?.();
    }

    getValues(): { email: string; password: string; rememberMe: boolean } {
        const rememberMeInput = this.form!.querySelector<HTMLInputElement>('input[name="rememberMe"]');
        return {
            email: this.inputs.email!.input.value.trim(),
            password: this.inputs.password!.input.value.trim(),
            rememberMe: rememberMeInput?.checked ?? false,
        };
    }
}
