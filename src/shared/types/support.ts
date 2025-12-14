export const CATEGORY_MAP = {
  'Приложение зависает/тормозит': 'app_freezing',
  'Не загружается страница': 'page_not_loading',
  'Не работает чат': 'chat_not_working',
  'Не работает профиль': 'profile_not_working',
  'Не работает мессенджер': 'messenger_not_working',
  'Не работает страница друзья': 'friend_not_working',
  'Проблема с авторизацией/входом': 'auth_problem',
} as const;

export type SupportCategoryLabel = keyof typeof CATEGORY_MAP;
export type SupportCategoryCode = (typeof CATEGORY_MAP)[SupportCategoryLabel];

export interface SupportCreatePayload {
  authorID: string;
  category: SupportCategoryCode;
  createdAt: string;
  updatedAt: string;
  emailFeedBack: string;
  emailReg: string;
  fullName: string;
  id: number;
  status: 'open' | 'closed';
  text: string;
  images: string[];
}

export type SupportWidgetPostMessage =
  | { type: 'support-widget:close' }
  | { type: 'support-widget:submitted' };

export interface CreateSupportFormInputs {
  regEmail: BaseInputLike;
  supportSelect: SelectInputLike;
  aboutProblem: BaseInputLike;
  nameInput: BaseInputLike;
  emailInput: BaseInputLike;
  imageInputs: ImageInputSmallLike[];
}

export interface BaseInputLike {
  render(): Promise<void> | void;
  getValue(): string;
}

export interface SelectInputLike {
  render(): Promise<void> | void;
  getValue(): string;
}

export interface ImageInputSmallLike {
  render(): Promise<void> | void;
  getImage(): File | null;
}

