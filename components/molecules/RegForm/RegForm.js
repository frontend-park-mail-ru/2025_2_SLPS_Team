import FormInput from "../../atoms/FormInput/FromInput.js";
import { renderFormButton } from "../../atoms/FormButtons/FormButton.js";
import CONFIG from '/config.js'
import {navigateTo} from "../../../index.js";

export default class RegistrationForm {
    constructor(container, options = {}) {
        this.container = container;
        this.options = options;
        this.form = null;
        this.inputs = {};
        this.currentStep = 1;
        this.savedValues = {};
        this.emailError = false;
    }

    async render() {
        const response = await fetch("../../components/molecules/RegForm/RegFrom.hbs");
        const templateSource = await response.text();
        const template = Handlebars.compile(templateSource);
        const html = template();

        const wrapper = document.createElement("div");
        wrapper.innerHTML = html.trim();

        this.form = wrapper.querySelector("form");
        this.container.appendChild(this.form);

        this.inputContainer = this.form.querySelector(".input-container");
        this.buttons = this.form.querySelector(".button-container");

        this.renderStep();
    }

    renderStep() {
        this.inputContainer.innerHTML = "";
        this.buttons.innerHTML = "";

        if (this.options.onStepChange) {
            this.options.onStepChange(this.currentStep);
        }

        if (this.currentStep === 1) {
            this.renderStep1();
        } else if (this.currentStep === 2) {
            this.renderStep2();
        } else if (this.currentStep === 3) {
            this.renderStep3();
        }
    }

    async renderStep1() {
        this.inputs.email = new FormInput(this.inputContainer, {
            name: "email",
            label: "Email",
            type: "email",
            placeholder: "Введите email",
            required: true,
            showRequired: true,
            value: this.savedValues?.email || ""
        });
        await this.inputs.email.render();

        this.inputs.password = new FormInput(this.inputContainer, {
            name: "password",
            label: "Пароль",
            type: "password",
            placeholder: "Введите пароль",
            required: true,
            showRequired: true,
            value: this.savedValues?.password || ""
        });
        await this.inputs.password.render();

        this.inputs.confirmPassword = new FormInput(this.inputContainer, {
            name: "confirmPassword",
            label: "Повторите пароль",
            type: "password",
            placeholder: "Повторите пароль",
            required: true,
            showRequired: true,
            value: this.savedValues?.confirmPassword || ""
        });
        await this.inputs.confirmPassword.render();

        if(this.emailError){
            this.validateStep1();
        }

        await renderFormButton(this.buttons, "button", "Далее", "accent", (e) => {
            e.preventDefault();
            if (this.validateStep1()) {
                this.savedValues.email = this.inputs.email.input.value;
                this.savedValues.password = this.inputs.password.input.value;
                this.savedValues.confirmPassword = this.inputs.confirmPassword.input.value;

                this.currentStep = 2;
                this.renderStep();
            }
        });

        renderFormButton(this.buttons, "button", "Войти", "base", (e) => {
            e.preventDefault();
            this.handleLogin();
        });
    }

    async renderStep2() {
        this.inputs.firstName = new FormInput(this.inputContainer, {
            name: "firstName",
            label: "Имя",
            type: "text",
            placeholder: "Введите имя",
            required: true,
            value: this.savedValues?.firstName || null
        });
        await this.inputs.firstName.render();

        this.inputs.lastName = new FormInput(this.inputContainer, {
            name: "lastName",
            label: "Фамилия",
            type: "text",
            placeholder: "Введите фамилию",
            required: true,
            value: this.savedValues?.lastName || null
        });
        await this.inputs.lastName.render();

        await renderFormButton(this.buttons, "button", "Далее", "accent", (e) => {
            e.preventDefault();
            if (this.validateStep2()) {
                this.savedValues.firstName = this.inputs.firstName.input.value;
                this.savedValues.lastName = this.inputs.lastName.input.value;
                this.currentStep = 3;
                this.renderStep();
            }
        });

        await renderFormButton(this.buttons, "button", "Назад", "base", (e) => {
            e.preventDefault();
            this.currentStep = 1;
            this.renderStep();
        });
    }

    async renderStep3() {
        this.inputs.age = new FormInput(this.inputContainer, {
            name: "age",
            label: "Возраст",
            type: "text",
            placeholder: "Введите возраст",
            required: true,
        });
        await this.inputs.age.render();

        const genderLabel = document.createElement("div");
        genderLabel.textContent = "Выберите пол";
        genderLabel.classList.add("small-lable")

        const genderContainer = document.createElement("div");
        genderContainer.classList.add("gender-container");

        genderContainer.innerHTML = `
            <label class="remember-me">
                <input type="checkbox" name="gender" value="male">
                <span class="custom-checkbox"></span>
                <div>Мужчина</div>
            </label>
            <label class="remember-me">
                <input type="checkbox" name="gender" value="female">
                <span class="custom-checkbox"></span>
                <div>Женщина</div>
            </label>
        `;

        this.inputContainer.appendChild(genderLabel);
        this.inputContainer.appendChild(genderContainer);

        const checkboxes = genderContainer.querySelectorAll('input[name="gender"]');
        checkboxes.forEach((checkbox) => {
            checkbox.addEventListener("change", () => {
                if (checkbox.checked) {
                    checkboxes.forEach((cb) => {
                        if (cb !== checkbox) cb.checked = false;
                    });
                }
            });
        });


        await renderFormButton(this.buttons, "submit", "Завершить", "accent", (e) => {
            e.preventDefault();
            if (this.validateStep3()) {
                this.handleSubmit();
            }
        });

        await renderFormButton(this.buttons, "button", "Назад", "base", (e) => {
            e.preventDefault();
            this.currentStep = 2;
            this.renderStep();
        });
    }

    validateStep1() {
        let valid = true;
        const email = this.inputs.email.input.value.trim();
        const pass = this.inputs.password.input.value.trim();
        const confirm = this.inputs.confirmPassword.input.value.trim();

        this.inputs.email.hideError();
        this.inputs.password.hideError();
        this.inputs.confirmPassword.hideError();
        if(this.emailError){
            this.inputs.email.showError("email занят");
            valid = false;
            this.emailError = false;
        }
        if (!email.includes("@")) {
            this.inputs.email.showError("Введите корректный email");
            valid = false;
        }
        if (pass.length < 6) {
            this.inputs.password.showError("Пароль слишком короткий");
            valid = false;
        }
        if (pass !== confirm) {
            this.inputs.confirmPassword.showError("Пароли не совпадают");
            valid = false;
        }

        return valid;
    }

    validateStep2() {
        let valid = true;
        const firstName = this.inputs.firstName.input.value.trim();
        const lastName = this.inputs.lastName.input.value.trim();

        this.inputs.firstName.hideError();
        this.inputs.lastName.hideError();

        if (!firstName) {
            this.inputs.firstName.showError("Введите имя");
            valid = false;
        }
        if (!lastName) {
            this.inputs.lastName.showError("Введите фамилию");
            valid = false;
        }

        return valid;
    }

    validateStep3() {
        let valid = true;
        const age = parseInt(this.inputs.age.input.value.trim(), 10);

        this.inputs.age.hideError();

        if (isNaN(age) || age <= 0) {
            this.inputs.age.showError("Введите корректный возраст");
            valid = false;
        }

        return valid;
    }

    handleSubmit() {
        const data = {
            email: this.inputs.email.input.value.trim(),
            password: this.inputs.password.input.value.trim(),
            username: this.inputs.firstName.input.value.trim() + this.inputs.lastName.input.value.trim(),
            confirmpassword: this.inputs.confirmPassword.input.value.trim(),
            age: this.inputs.age.input.value.trim(),
            gender: this.form.querySelector('input[name="gender"]:checked')?.value || null,
        };
        fetch(`${CONFIG.API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: data.username,
                email: data.email,
                password: data.password,
                confirm_password: data.confirmpassword,
            }),
        })
            .then(res => res.json())
            .then(data => {
                if (data.Message === "User already exist") {
                    this.emailError = true;
                    this.currentStep = 1;
                    this.renderStep(true);
                    return;
                }


                console.log("Регистрация завершена:", data);

                if (this.options.onSubmit) {
                    this.options.onSubmit(data);
                }

            })
            .catch(err => {
                console.error('Ошибка при регистрации:', err);
            })
    }

    handleLogin() {
        if (this.options.onLog) {
            this.options.onLog();
        }
    }
}
