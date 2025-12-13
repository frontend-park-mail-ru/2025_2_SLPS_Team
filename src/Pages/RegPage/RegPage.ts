import RegistrationForm from '../../components/molecules/RegForm/RegForm';
import RegPageTemplate from './RegPage.hbs';
import { registerUser, loginUser } from '../../shared/api/authApi';
import { navigateTo } from '../../app/router/navigateTo';

type Step = 1 | 2 | 3;

type StepInfoItem = {
  big: string;
  small: string;
};

const stepInfo: Record<Step, StepInfoItem> = {
  1: { big: 'Создать аккаунт', small: 'Введите email и пароль' },
  2: { big: 'Создать аккаунт', small: 'Введите имя и фамилию' },
  3: { big: 'Создать аккаунт', small: 'Укажите возраст и пол' },
};

type RegFormData = {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  gender: string;
  dob: string;
};

type RegPageOptions = {
  onSubmit?: (formData: RegFormData) => void;
  onLog?: () => void;
};

type ApiErrorLike = {
  status?: number;
  data?: { message?: string; error?: string };
};

function isApiErrorLike(e: unknown): e is ApiErrorLike {
  return typeof e === 'object' && e !== null;
}

export async function renderRegPage(
  container: HTMLElement,
  options: RegPageOptions = {},
): Promise<RegistrationForm> {
  const html = RegPageTemplate({ logo: '/public/globalImages/Logo.svg' });
  container.innerHTML = html;

  const infoContainer = container.querySelector('.reg-form-info') as HTMLElement | null;
  const formContainer = container.querySelector('#reg-form-container') as HTMLElement | null;

  const tempContainer = document.createElement('div');

  const regForm = new RegistrationForm(tempContainer, {
    onSubmit: (data: Record<string, any>) => {
      const formData = data as RegFormData;

      void (async () => {
        try {
          if (formData.password !== formData.confirmPassword) {
            alert('Пароли не совпадают');
            return;
          }

          await registerUser({
            email: formData.email,
            password: formData.password,
            firstName: formData.firstName,
            lastName: formData.lastName,
            gender: formData.gender,
            dob: formData.dob,
          });

          try {
            await loginUser({
              email: formData.email,
              password: formData.password,
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
        } catch (e: unknown) {
          console.error('Ошибка регистрации:', e);

          const backendMessage = isApiErrorLike(e)
            ? e.data?.message || e.data?.error || ''
            : '';

          const msgLower = backendMessage.toLowerCase();

          const isEmailAlreadyExists =
            (isApiErrorLike(e) && e.status === 409) ||
            msgLower.includes('already') ||
            msgLower.includes('exist') ||
            msgLower.includes('существ');

          if (isEmailAlreadyExists) {
            (regForm as unknown as { emailError?: boolean }).emailError = true;

            (regForm as unknown as { currentStep: number }).currentStep = 1;
            (regForm as unknown as { animationStatus: string }).animationStatus = 'back';
            (regForm as unknown as { renderStep: () => void }).renderStep();
            return;
          }

          alert(backendMessage || 'Произошла ошибка при регистрации. Попробуйте позже');
        }
      })();
    },

    onLog: () => {
      if (typeof options.onLog === 'function') {
        options.onLog();
      } else {
        navigateTo('/login');
      }
    },

    onStepChange: (step: number) => {
      const s = step as Step;
      const info = stepInfo[s];
      if (!info || !infoContainer) return;

      const big = infoContainer.querySelector('.info-text-big') as HTMLElement | null;
      const small = infoContainer.querySelector('.info-text-small') as HTMLElement | null;

      if (big) big.textContent = info.big;
      if (small) small.textContent = info.small;
    },
  });

  await regForm.render();

  if (formContainer && tempContainer.firstElementChild) {
    formContainer.appendChild(tempContainer.firstElementChild);
  }

  return regForm;
}
