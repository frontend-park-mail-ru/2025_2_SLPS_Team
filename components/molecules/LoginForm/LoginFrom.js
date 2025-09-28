import FormInput from "../../atoms/FormInput/FromInput.js";
import { renderFormButton } from "../../atoms/FormButtons/FormButton.js";

export default class LoginForm {
    constructor(container, options = {}) {
        this.container = container;
        this.options = options;
        this.form = null;
        this.inputs = {};
    }

    async render() {
    const response = await fetch("../components/molecules/LoginForm/LoginFrom.hbs");
        const templateSource = await response.text();
        const template = Handlebars.compile(templateSource);
        const html = template();

        const wrapper = document.createElement("div");
        wrapper.innerHTML = html.trim();

        this.form = wrapper.querySelector("form");
        
        this.container.appendChild(this.form);

        const inputContainer = this.form.querySelector('.input-container'); 
        const buttons = this.form.querySelector('.button-container')

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

        await renderFormButton(buttons, "submit", "Войти", "accent", (e) => {
            e.preventDefault();
            this.handleSubmit();
        });


        await renderFormButton(buttons, "button", "Регистрация", "base", (e) => {
            e.preventDefault();
            this.handleRegister();
        });


        this.container.appendChild(this.form);
    }

    handleSubmit() {
        const { email, password, rememberMe } = this.getValues();
        console.log(email,password,rememberMe);
        fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: email,
                    password: password
                }),
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        console.log("Успешный вход");
                            if (this.options.onSubmit) {
                                this.options.onSubmit({ email, password });
                            }
                    } else {
                        this.inputs.email.showError("Неверный email");
                        this.inputs.password.showError("Неверный пароль");
                    }
                })
                .catch(err => {
                    console.error("Ошибка при запросе:", err);
                });
    }

    handleRegister() {
        if (this.options.onReg) {
            this.options.onReg();
        }
    }



    getValues() {
        const rememberMeInput = this.form.querySelector('input[name="rememberMe"]');
        return {
            email: this.inputs.email.input.value.trim(),
            password: this.inputs.password.input.value.trim(),
            rememberMe: rememberMeInput? rememberMeInput.checked : false,
        };
    }
}
