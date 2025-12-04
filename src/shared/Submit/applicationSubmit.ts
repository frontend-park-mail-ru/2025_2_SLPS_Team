export type ApplicationStatus = 'Открыто' | 'В работе' | 'Закрыто' | 'Отменено';

export interface ApplicationData {
  full_name: string;
  emailFeedBack: string;
  topic: string;
  text: string;
  images?: string[];
}

export interface ApplicationStatusPayload {
  status: ApplicationStatus;
  application: ApplicationData;
}


export function prepareApplicationStatus(
  statusRaw: string,
  application: ApplicationData,
): ApplicationStatusPayload | null {
  const allowed: ApplicationStatus[] = ['Открыто', 'В работе', 'Закрыто', 'Отменено'];
  const normalized = allowed.find((s) => s === statusRaw) ?? null;

  if (!normalized) {
    return null;
  }

  return {
    status: normalized,
    application,
  };
}
