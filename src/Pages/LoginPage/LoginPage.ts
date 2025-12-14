import LoginForm from '../../components/molecules/LoginForm/LoginFrom';
import loginPageTemplate from './LoginPage.hbs';
import { loginUser } from '../../shared/api/authApi';
import { navigateTo } from '../../app/router/navigateTo';

type LoginFormData = {
  email: string;
  password: string;
  rememberMe: boolean;
};

type LoginPageOptions = {
  onSubmit?: (data: { email: string; password: string; rememberMe: boolean }) => void;
  onReg?: () => void;
};

export async function renderLoginPage(
  container: HTMLElement,
  options: LoginPageOptions = {},
): Promise<LoginForm> {
  const html = loginPageTemplate({ logo: '/public/globalImages/Logo.svg' });
  container.innerHTML = html;

  const formContainer = container.querySelector('#login-form-container') as HTMLElement | null;
  const tempContainer = document.createElement('div');

  const loginForm = new LoginForm(tempContainer, {
    onSubmit: (data: LoginFormData) => {
      void (async () => {
        try {
          await loginUser({ email: data.email, password: data.password });

          options.onSubmit?.(data);

          window.location.href = '/';
        } catch (e: unknown) {
          console.error('Ошибка логина:', e);
        }
      })();
    },

    onReg: () => {
      if (typeof options.onReg === 'function') options.onReg();
      else navigateTo('/register');
    },
  });

  await loginForm.render();

  if (formContainer && tempContainer.firstElementChild) {
    formContainer.appendChild(tempContainer.firstElementChild);
  }

  return loginForm;
}
