import FormInput from "../../atoms/FormInput/FromInput.js";
import { renderFormButton } from "../../atoms/FormButtons/FormButtons.js";
import RegFormTemplate from './RegForm.hbs'
import { gsap } from "gsap";
import { authService } from "../../../services/AuthService.js";
import SelectInput from "../../atoms/SelectInput/SelectInput.js";
import { ModalConfirm } from '../ModalConfirm/ModalConfirm.js';

const MONTH_NAMES = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

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

        if (this.emailError) {
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
        const dobLabel = document.createElement("div");
        dobLabel.textContent = "Дата рождения";
        dobLabel.classList.add("small-lable");
        this.inputContainer.appendChild(dobLabel);

        const dobRow = document.createElement("div");
        dobRow.classList.add("reg-bth-container");
        this.inputContainer.appendChild(dobRow);

        const dayContainer = document.createElement("div");
        dayContainer.classList.add("reg-bth-day");
        dobRow.appendChild(dayContainer);

        const days = Array.from({ length: 31 }, (_, i) => ({
            label: String(i + 1),
            value: String(i + 1),
            active: i + 1 === 1,
        }));

        this.inputs.bthDay = new SelectInput(dayContainer, { values: days });
        await this.inputs.bthDay.render();

        const monthContainer = document.createElement("div");
        monthContainer.classList.add("reg-bth-month");
        dobRow.appendChild(monthContainer);

        const months = MONTH_NAMES.map((name, index) => ({
            label: name,
            value: name,
            active: index === 0,
        }));

        this.inputs.bthMonth = new SelectInput(monthContainer, { values: months });
        await this.inputs.bthMonth.render();

        const yearContainer = document.createElement("div");
        yearContainer.classList.add("reg-bth-year");
        dobRow.appendChild(yearContainer);

        const MIN_AGE = 14;
        const currentYear = new Date().getFullYear();
        const maxYear = currentYear - MIN_AGE;
        const minYear = currentYear - 120;

        const years = [];
        for (let y = maxYear; y >= minYear; y--) {
            years.push({
                label: String(y),
                value: String(y),
                active: y === maxYear,
            });
        }

        this.inputs.bthYear = new SelectInput(yearContainer, { values: years });
        await this.inputs.bthYear.render();


        const genderLabel = document.createElement("div");
        genderLabel.textContent = "Выберите пол";
        genderLabel.classList.add("small-lable");

        const genderContainer = document.createElement("div");
        genderContainer.classList.add("gender-container");
        genderContainer.innerHTML = `
            <label class="remember-me">
                <input type="checkbox" name="gender" value="Мужской">
                <span class="custom-checkbox"></span>
                <div>Мужчина</div>
            </label>
            <label class="remember-me">
                <input type="checkbox" name="gender" value="Женский">
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

        if (this.emailError) {
            this.inputs.email.showError("Пользователь с таким email уже зарегистрирован");
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
        const showError = (message) => {
            const modal = new ModalConfirm(
                'Ошибка валидации',
                message,
                () => {} 
            );
            modal.open();
        };

        const day = Number(this.inputs.bthDay.getValue());
        const monthName = this.inputs.bthMonth.getValue();
        const year = Number(this.inputs.bthYear.getValue());

        if (!day || !monthName || !year) {
            showError('Заполните дату рождения');
            return false;
        }

        const monthIndex = MONTH_NAMES.indexOf(monthName);
        if (monthIndex === -1) {
            showError('Выбран некорректный месяц');
            return false;
        }

        const birthDate = new Date(Date.UTC(year, monthIndex, day));
        const today = new Date();

        let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
        const m = today.getUTCMonth() - birthDate.getUTCMonth();
        if (m < 0 || (m === 0 && today.getUTCDate() < birthDate.getUTCDate())) {
            age--;
        }

        if (age < 14 || age > 120) {
            showError('Возраст должен быть от 14 до 120 лет');
            return false;
        }

        const genderInput = this.form.querySelector('input[name="gender"]:checked');
        if (!genderInput) {
            showError('Выберите пол');
            return false;
        }

        return true;
    }




    handleSubmit() {
        const day = Number(this.inputs.bthDay.getValue());
        const monthName = this.inputs.bthMonth.getValue();
        const year = Number(this.inputs.bthYear.getValue());
        const monthIndex = MONTH_NAMES.indexOf(monthName);

        const dob = new Date(Date.UTC(year, monthIndex, day)).toISOString();

        const gender = this.form.querySelector('input[name="gender"]:checked')?.value || null;

        const data = {
            email: this.inputs.email.input.value.trim(),
            password: this.inputs.password.input.value.trim(),
            confirmPassword: this.inputs.confirmPassword.input.value.trim(),
            firstName: this.inputs.firstName.input.value.trim(),
            lastName: this.inputs.lastName.input.value.trim(),
            dob,
            gender,
        };

        if (this.options.onSubmit) {
            this.options.onSubmit(data);
        }
    }

    handleLogin() {
        if (this.options.onLog) {
            this.options.onLog();
        }
    }
}
