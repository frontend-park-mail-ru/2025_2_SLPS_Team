import LoginForm from '../../components/molecules/LoginForm/LoginFrom.js';
import loginPageTemplate from './LoginPage.hbs';
import { loginUser } from '../../shared/api/authApi.js';
import { navigateTo } from '../../app/router/navigateTo.js';

export async function renderLoginPage(container, options = {}) {
  const html = loginPageTemplate({ logo: '/public/globalImages/Logo.svg' });
  container.innerHTML = html;

  const formContainer = container.querySelector('#login-form-container');
  const tempContainer = document.createElement('div');

  const loginForm = new LoginForm(tempContainer, {
    onSubmit: async ({ email, password, rememberMe }) => {
      try {
        await loginUser({ email, password, rememberMe: !!rememberMe });

        if (typeof options.onSubmit === 'function') {
          options.onSubmit({ email, password, rememberMe });
        }

        window.location.href = '/';
      } catch (e) {
        console.error('Ошибка логина:', e);
      }
    },
    onReg: () => {
      if (typeof options.onReg === 'function') {
        options.onReg();
      } else {
        navigateTo('/register');
      }
    },
  });

  await loginForm.render();

  if (formContainer) {
    formContainer.appendChild(tempContainer.firstElementChild);
  }

  return loginForm;
}
