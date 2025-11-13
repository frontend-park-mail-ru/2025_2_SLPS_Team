import RegistrationForm from '../../components/molecules/RegForm/RegForm.js';
import RegPageTemplate from './RegPage.hbs';
import { registerUser, loginUser } from '../../shared/api/authApi.js';
import { navigateTo } from '../../app/router/navigateTo.js';

export async function renderRegPage(container, options = {}) {
  const html = RegPageTemplate({ logo: '/public/globalImages/Logo.svg' });
  container.innerHTML = html;

  const infoContainer = container.querySelector('.reg-form-info');
  const formContainer = container.querySelector('#reg-form-container');
  const tempContainer = document.createElement('div');

  const regForm = new RegistrationForm(tempContainer, {
    onSubmit: async (formData) => {
    try {
      await registerUser({
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        firstName: formData.firstName,
        lastName: formData.lastName,
        gender: formData.gender,
        dob: formData.dob,
      });

      try {
        await loginUser({
          email: formData.email,
          password: formData.password,
          rememberMe: true,
        });
      } catch (e) {
        console.warn('Не удалось залогиниться сразу после регистрации', e);
        window.location.href = '/login';
        return;
      }

      if (typeof options.onSubmit === 'function') {
        options.onSubmit(formData);
      }

      window.location.href = '/';
    } catch (e) {
      console.error('Ошибка регистрации:', e);

      // Если email уже существует
      if (e.status === 409) {
        const backendMessage =
          e.data?.message ||
          e.data?.error ||
          'Пользователь с таким email уже существует';

        if (typeof regForm.setFieldError === 'function') {
          regForm.setFieldError('email', backendMessage);
          return;
        }

        if (typeof regForm.setGlobalError === 'function') {
          regForm.setGlobalError(backendMessage);
          return;
        }

        // Вариант 3: совсем в лоб — через alert (временный костыль)
        alert(backendMessage);
        return;
      }

      // Любая другая ошибка регистрации
      const commonMessage =
        e.data?.message ||
        e.data?.error ||
        'Произошла ошибка при регистрации. Попробуйте позже';

      if (typeof regForm.setGlobalError === 'function') {
        regForm.setGlobalError(commonMessage);
      } else {
        alert(commonMessage);
      }
    }
  },
    onLog: () => {
      if (typeof options.onLog === 'function') {
        options.onLog();
      } else {
        navigateTo('/login');
      }
    },
    onStepChange: (step) => {
      const info = stepInfo[step];
      if (info && infoContainer) {
        infoContainer.querySelector('.info-text-big').textContent = info.big;
        infoContainer.querySelector('.info-text-small').textContent = info.small;
      }
    },
  });

  await regForm.render();

  if (formContainer) {
    formContainer.appendChild(tempContainer.firstElementChild);
  }

  return regForm;
}

const stepInfo = {
  1: {
    big: 'Создать аккаунт',
    small: 'Введите email и пароль',
  },
  2: {
    big: 'Создать аккаунт',
    small: 'Введите имя и фамилию',
  },
  3: {
    big: 'Создать аккаунт',
    small: 'Укажите возраст и пол',
  },
};
