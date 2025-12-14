import type { SupportCreatePayload, SupportCategoryCode } from '../types/support';

export function nowIso(): string {
  return new Date().toISOString();
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('FileReader error'));
    reader.readAsDataURL(file);
  });
}

export async function filesToBase64(files: File[]): Promise<string[]> {
  const out: string[] = [];
  for (const f of files) out.push(await fileToBase64(f));
  return out;
}

export function clearErrors(root: ParentNode): void {
  root.querySelectorAll('.support-input-error')
    .forEach((el) => el.classList.remove('support-input-error'));
}

export function markError(el: Element | null): void {
  if (el instanceof HTMLElement) el.classList.add('support-input-error');
}

interface BuildSupportPayloadArgs {
  topic: SupportCategoryCode;
  loginEmail: string;
  contactEmail: string;
  fullName: string;
  text: string;
  images: string[];
  authorID?: string;
}

export function buildSupportPayload(args: BuildSupportPayloadArgs): SupportCreatePayload {
  const now = nowIso();
  return {
    authorID: args.authorID ?? 'temp',
    category: args.topic,
    createdAt: now,
    updatedAt: now,
    emailFeedBack: args.contactEmail,
    emailReg: args.loginEmail,
    fullName: args.fullName,
    id: 0,
    status: 'open',
    text: args.text,
    images: args.images,
  };
}
