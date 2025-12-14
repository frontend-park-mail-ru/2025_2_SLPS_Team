export type RegistrationFormOptions = {
  onStepChange?: (step: number) => void;
  onSubmit?: (data: Record<string, any>) => void;
  onLog?: () => void;
};

export type SavedValues = {
  email?: string;
  password?: string;
  confirmPassword?: string;
  firstName?: string;
  lastName?: string;
  bthDay?: string;
  bthMonth?: string;
  bthYear?: string;
  gender?: string;
  dob?: string;
};

export const MONTH_NAMES = [
  "Январь","Февраль","Март","Апрель","Май","Июнь",
  "Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь",
];