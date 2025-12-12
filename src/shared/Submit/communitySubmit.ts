
import type { EditCommunityInitialFormData } from '../types/components';

interface ResolveAvatarPreviewSrcArgs {
  formData: EditCommunityInitialFormData;
  defaultAvatar: string;
  apiBaseUrl?: string;
}


export function resolveAvatarPreviewSrc({
  formData,
  defaultAvatar,
  apiBaseUrl,
}: ResolveAvatarPreviewSrcArgs): string {
  const raw = formData.avatarPath;

  if (!raw) return defaultAvatar;

  if (raw.startsWith('http') || raw.startsWith('/')) return raw;

  const base = apiBaseUrl ? `${apiBaseUrl}/uploads/` : '/uploads/';
  return `${base}${raw}`;
}

interface BuildUpdateCommunityFormDataArgs {
  name: string;
  description: string;
  avatarFile: File | null;
  avatarDeleted: boolean;
}

export function buildUpdateCommunityFormData({
  name,
  description,
  avatarFile,
  avatarDeleted,
}: BuildUpdateCommunityFormDataArgs): FormData {
  const formData = new FormData();
  formData.append('name', name);
  formData.append('description', description);

  if (avatarFile) {
    formData.append('avatar', avatarFile);
  } else if (avatarDeleted) {
    formData.append('avatarDelete', 'true');
  }

  return formData;
}
