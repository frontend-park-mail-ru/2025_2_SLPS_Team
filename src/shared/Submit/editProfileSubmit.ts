import { updateProfile, deleteProfileAvatar } from '../api/profileApi.js';

export interface EditProfileSubmitParams {
  profileJson: {
    firstName: string;
    lastName: string;
    aboutMyself: string;
    dob: string;
    gender: string;
  };
  avatarFile: File | null;
  avatarDeleted: boolean;
}

export async function processEditProfileSubmit(
  params: EditProfileSubmitParams,
): Promise<void> {
  const { profileJson, avatarFile, avatarDeleted } = params;

  const formData = new FormData();
  formData.append('profile', JSON.stringify(profileJson));

  if (avatarFile) {
    formData.append('avatar', avatarFile);
  } else if (avatarDeleted) {
    await deleteProfileAvatar();
  }

  await updateProfile(formData);
}
