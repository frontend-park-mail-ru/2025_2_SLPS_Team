import RegistrationForm from '../../components/molecules/RegForm/RegForm';
import RegPageTemplate from './RegPage.hbs';
import { registerUser, loginUser } from '../../shared/api/authApi';
import { navigateTo } from '../../app/router/navigateTo';

type RenderRegPageOptions = {
  onSubmit?: (data: Record<string, any>) => void;
  onLog?: () => void;
};

type RegFormInstance = {
  render: () => Promise<void>;
  renderStep: () => void;
  emailError: boolean;
  currentStep: number;
  animationStatus: 'forward' | 'back';
};

const stepInfo: Record<number, { big: string; small: string }> = {
  1: { big: 'Создать аккаунт', small: 'Введите email и пароль' },
  2: { big: 'Создать аккаунт', small: 'Введите имя и фамилию' },
  3: { big: 'Создать аккаунт', small: 'Укажите возраст и пол' },
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function getBackendMessage(err: unknown): string {
  if (!isRecord(err)) return '';
  const data = isRecord(err.data) ? err.data : undefined;
  const msg = typeof data?.message === 'string' ? data.message : '';
  const e = typeof data?.error === 'string' ? data.error : '';
  return msg || e || '';
}

function getStatus(err: unknown): number | undefined {
  if (!isRecord(err)) return undefined;
  return typeof err.status === 'number' ? err.status : undefined;
}

export async function renderRegPage(
  container: HTMLElement,
  options: RenderRegPageOptions = {},
): Promise<RegFormInstance> {
  const html = RegPageTemplate({ logo: '/public/globalImages/Logo.svg' });
  container.innerHTML = html;

  const infoContainer = container.querySelector<HTMLElement>('.reg-form-info');
  const formContainer = container.querySelector<HTMLElement>('#reg-form-container');
  const tempContainer = document.createElement('div');

  const regForm = new RegistrationForm(tempContainer, {
    onSubmit: (formData: Record<string, any>) => {
      void (async () => {
        try {
          await registerUser({
            email: String(formData.email ?? '').trim(),
            password: String(formData.password ?? '').trim(),
            firstName: String(formData.firstName ?? '').trim(),
            lastName: String(formData.lastName ?? '').trim(),
            gender: formData.gender ?? null,
            dob: String(formData.dob ?? ''),
          } as any);

          try {
            await loginUser({
              email: String(formData.email ?? '').trim(),
              password: String(formData.password ?? '').trim(),
              rememberMe: true,
            } as any);
          } catch {
            window.location.href = '/login';
            return;
          }

          if (typeof options.onSubmit === 'function') {
            options.onSubmit(formData);
          }

          window.location.href = '/';
        } catch (e: unknown) {
          const backendMessage = getBackendMessage(e);
          const status = getStatus(e);
          const low = backendMessage.toLowerCase();

          const isEmailAlreadyExists =
            status === 409 || low.includes('already') || low.includes('exist') || low.includes('существ');

          if (isEmailAlreadyExists) {
            (regForm as unknown as RegFormInstance).emailError = true;
            (regForm as unknown as RegFormInstance).currentStep = 1;
            (regForm as unknown as RegFormInstance).animationStatus = 'back';
            (regForm as unknown as RegFormInstance).renderStep();
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
      const info = stepInfo[step];
      if (!info || !infoContainer) return;

      const big = infoContainer.querySelector<HTMLElement>('.info-text-big');
      const small = infoContainer.querySelector<HTMLElement>('.info-text-small');

      if (big) big.textContent = info.big;
      if (small) small.textContent = info.small;
    },
  }) as unknown as RegFormInstance;

  await regForm.render();

  if (formContainer && tempContainer.firstElementChild) {
    formContainer.appendChild(tempContainer.firstElementChild);
  }

  return regForm;
}
