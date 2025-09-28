import LoginForm from '../../components/molecules/LoginForm/LoginFrom.js';

export async function renderLoginPage(container, options = {}) {
    try {
        const response = await fetch('./pages/LoginPage/LoginPage.hbs');
        const templateSource = await response.text();
        const template = Handlebars.compile(templateSource);

        const tempContainer = document.createElement("div");
        const loginForm = new LoginForm(tempContainer, {
            onSubmit: options.onSubmit || ((data) => console.log("Форма отправлена:", data)),
            onReg: options.onReg
        });
        await loginForm.render();

        const html = template({ logo: './asserts/logo.svg'});

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

