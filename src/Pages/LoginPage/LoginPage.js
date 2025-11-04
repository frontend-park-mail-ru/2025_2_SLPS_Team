import LoginForm from '../../components/molecules/LoginForm/LoginFrom.js';
import loginPageTemplate from './LoginPage.hbs';

/**
 * Рендерит страницу авторизации и добавляет форму входа в указанный контейнер.
 *
 * @async
 * @function renderLoginPage
 * @param {HTMLElement} container - DOM-элемент, в который будет отрисована страница входа.
 * @param {Object} [options={}] - Опции для настройки формы входа.
 * @param {function(Object):void} [options.onSubmit] - Колбэк, вызываемый при отправке формы (получает данные формы).
 * @param {function():void} [options.onReg] - Колбэк, вызываемый при переходе к регистрации.
 * @returns {Promise<LoginForm|undefined>} Экземпляр класса LoginForm или `undefined` в случае ошибки.
 */
export async function renderLoginPage(container, options = {}) {
    try {
        const template = loginPageTemplate;

        const tempContainer = document.createElement("div");
        const loginForm = new LoginForm(tempContainer, {
            onSubmit: options.onSubmit || ((data) => console.log("Форма отправлена:", data)),
            onReg: options.onReg
        });
        await loginForm.render();

        const html = template({ logo: '/public/globalImages/Logo.svg'});

        container.innerHTML = html;

        const formContainer = container.querySelector("#login-form-container");
        if (formContainer) {
            formContainer.appendChild(tempContainer.firstElementChild);
        }

        return loginForm;

    } catch (error) {
        console.error('Ошибка при рендере LoginPage:', error);
    }
}

