import RegistrationForm from '../../components/molecules/RegForm/RegForm';
import RegPageTemplate from './RegPage.hbs';
import { registerUser, loginUser } from '../../shared/api/authApi';
import { navigateTo } from '../../app/router/navigateTo';

type RenderRegPageOptions = {
  onSubmit?: (data: Record<string, unknown>) => void;
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

function toStr(v: unknown): string {
  return String(v ?? '').trim();
}

function backendMessage(err: unknown): string {
  if (!isRecord(err)) return '';
  const data = isRecord(err.data) ? err.data : undefined;
  const msg = typeof data?.message === 'string' ? data.message : '';
  const e = typeof data?.error === 'string' ? data.error : '';
  return msg || e || '';
}

function backendStatus(err: unknown): number | undefined {
  if (!isRecord(err)) return undefined;
  return typeof err.status === 'number' ? err.status : undefined;
}

type FormDataFromRegForm = Record<string, unknown>;
type RegisterPayload = Parameters<typeof registerUser>[0];
type LoginPayload = Parameters<typeof loginUser>[0];

type RegisterPayloadWithConfirm = RegisterPayload & { confirmPassword: string };

const registerUserWithConfirm = registerUser as unknown as (
  payload: RegisterPayloadWithConfirm,
) => ReturnType<typeof registerUser>;

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
    onSubmit: ((formData: FormDataFromRegForm) => {
      void (async () => {
        try {
          const genderValue = toStr(formData.gender);
          const safeGender = genderValue || 'Мужской';

          await registerUserWithConfirm({
            confirmPassword: toStr(formData.confirmPassword),
            email: toStr(formData.email),
            password: toStr(formData.password),
            firstName: toStr(formData.firstName),
            lastName: toStr(formData.lastName),
            dob: toStr(formData.dob),
            gender: safeGender,
          });

          try {
            await loginUser({
              ...(formData as unknown as LoginPayload),
              email: toStr(formData.email),
              password: toStr(formData.password),
              rememberMe: true,
            });
          } catch {
            window.location.href = '/login';
            return;
          }

          if (typeof options.onSubmit === 'function') {
            options.onSubmit(formData);
          }

          window.location.href = '/';
        } catch (e: unknown) {
          const msg = backendMessage(e);
          const status = backendStatus(e);
          const low = msg.toLowerCase();

          const isEmailAlreadyExists =
            status === 409 ||
            low.includes('already') ||
            low.includes('exist') ||
            low.includes('существ');

          if (isEmailAlreadyExists) {
            (regForm as unknown as RegFormInstance).emailError = true;
            (regForm as unknown as RegFormInstance).currentStep = 1;
            (regForm as unknown as RegFormInstance).animationStatus = 'back';
            (regForm as unknown as RegFormInstance).renderStep();
            return;
          }

          alert(msg || 'Произошла ошибка при регистрации. Попробуйте позже');
        }
      })();
    }) as unknown as (data: Record<string, any>) => void,

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
