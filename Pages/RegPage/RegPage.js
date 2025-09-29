import RegistrationForm from '../../components/molecules/RegForm/RegForm.js';

export async function renderRegPage(container, options = {}) {
    const template = Handlebars.templates['RegPage.hbs'];

    const tempContainer = document.createElement("div");
    const html = template({ logo: './asserts/logo.svg'});
    container.innerHTML = html;

    const infoContainer = container.querySelector(".reg-form-info");
    const formContainer = container.querySelector("#reg-form-container");

    const RegForm = new RegistrationForm(tempContainer, {
        onSubmit: options.onSubmit || ((data) => console.log("Форма отправлена:", data)),
        onLog: options.onLog,
        onStepChange: (step) => {
            const info = stepInfo[step];
            if (info) {
                infoContainer.querySelector(".info-text-big").textContent = info.big;
                infoContainer.querySelector(".info-text-small").textContent = info.small;
            }
        }
    });

    await RegForm.render();

    if (formContainer) {
        formContainer.appendChild(tempContainer.firstElementChild);
    }

    return RegForm;
}


const stepInfo = {
    1: {
        big: "Создать аккаунт",
        small: "Введите email и пароль"
    },
    2: {
        big: "Создать аккаунт",
        small: "Введите имя и фамилию"
    },
    3: {
        big: "Создать аккаунт",
        small: "Укажите возраст и пол"
    }
};


