import FormInput from "../../atoms/FormInput/FromInput.js";
import { renderFormButton } from "../../atoms/FormButtons/FormButtons.js";
import RegFormTemplate from './RegForm.hbs'
import { gsap } from "gsap";


/**
 * Класс для рендеринга многошаговой формы регистрации.
 *
 * @class RegistrationForm
 * @property {HTMLElement} container - DOM-элемент, в который рендерится форма.
 * @property {Object} options - Опции и коллбеки формы.
 * @property {Function} [options.onSubmit] - Коллбек, вызываемый при успешной регистрации.
 * @property {Function} [options.onLog] - Коллбек, вызываемый при переходе к авторизации.
 * @property {Function} [options.onStepChange] - Коллбек, вызываемый при смене шага регистрации.
 * @property {HTMLFormElement|null} form - Ссылка на DOM-элемент формы.
 * @property {Object.<string, FormInput>} inputs - Поля ввода, сгруппированные по имени.
 * @property {number} currentStep - Текущий шаг регистрации (1, 2 или 3).
 * @property {Object} savedValues - Сохранённые значения с предыдущих шагов.
 * @property {boolean} emailError - Флаг ошибки email (например, если email занят).
 */
export default class RegistrationForm {
    constructor(container, options = {}) {
        this.container = container;
        this.options = options;
        this.form = null;
        this.inputs = {};
        this.currentStep = 1;
        this.savedValues = {};
        this.emailError = false;
        this.animationStatus = "forward";
    }

    async render() {
        const template = RegFormTemplate;
        const html = template();

        const wrapper = document.createElement("div");
        wrapper.innerHTML = html.trim();

        this.form = wrapper.querySelector("form");
        this.container.appendChild(this.form);

        this.inputContainer = this.form.querySelector(".input-container");
        this.buttons = this.form.querySelector(".button-container");

        this.renderStep();
    }

    async renderStepAnimated(renderFn, direction = "forward") {

        const stepContainer = document.createElement("div");
        stepContainer.classList.add("step-wrapper");
        stepContainer.style.display = "flex";
        stepContainer.style.flexDirection = "column"
        stepContainer.style.gap = "18px";

        stepContainer.appendChild(this.inputContainer);
        stepContainer.appendChild(this.buttons);

        this.form.appendChild(stepContainer);

        const offset = 40;

        this.inputContainer.innerHTML = "";
        this.buttons.innerHTML = "";

        await renderFn();

        await gsap.fromTo(stepContainer,
            { opacity: 0, x: direction === "forward" ? offset : -offset },
            { opacity: 1, x: 0, duration: 0.3, ease: "power1.inOut" }
        );

        this.form.appendChild(this.inputContainer);
        this.form.appendChild(this.buttons);
        stepContainer.remove();
    }



    renderStep() {
        this.inputContainer.innerHTML = "";
        this.buttons.innerHTML = "";

        if (this.options.onStepChange) {
            this.options.onStepChange(this.currentStep);
        }

        if (this.currentStep === 1) {
            this.renderStepAnimated(() => this.renderStep1(), this.animationStatus);
        } else if (this.currentStep === 2) {
            this.renderStepAnimated(() => this.renderStep2(), this.animationStatus);
        } else if (this.currentStep === 3) {
            this.renderStepAnimated(() => this.renderStep3(), this.animationStatus);
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
                this.animationStatus = "forward";
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
                this.animationStatus = "forward";
                this.currentStep = 3;
                this.renderStep();
            }
        });

        await renderFormButton(this.buttons, "button", "Назад", "base", (e) => {
            e.preventDefault();
            this.animationStatus = "back";
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
            this.animationStatus = "back";
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
        const emailRegex =
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/u;

        if (!emailRegex.test(email)) {
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

        if (
        !/^\d+$/.test(age) ||
        Number(age) < 14 || 
        Number(age) > 120 
        ) {
            this.inputs.age.showError("Введите корректный возраст");
            valid = false;
        }

        return valid;
    }
    handleSubmit() {
        const age = parseInt(this.inputs.age.input.value.trim(), 10);
        const currentYear = new Date().getFullYear();
        const birthYear = currentYear - age;
        const dob = new Date(Date.UTC(birthYear, 0, 1, 0, 0, 0)).toISOString();


        const data = {
            email: this.inputs.email.input.value.trim(),
            password: this.inputs.password.input.value.trim(),
            firstName: this.inputs.firstName.input.value.trim(),
            lastName: this.inputs.lastName.input.value.trim(),
            confirmpassword: this.inputs.confirmPassword.input.value.trim(),
            dob: dob,
            gender: this.form.querySelector('input[name="gender"]:checked')?.value || null,
        };
        fetch(`${process.env.API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                password: data.password,
                confirmPassword: data.confirmpassword,
                dob: dob,
            }),
        })
            .then(res => res.json())
            .then(data => {
                if (data.message === "User already exist") {
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
