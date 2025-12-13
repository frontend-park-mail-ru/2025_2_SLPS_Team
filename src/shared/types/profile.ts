export interface RelationsCountDTO {
  countAccepted?: number | null;
  countPending?: number | null;
  countSent?: number | null;
  countBlocked?: number | null;
}

export interface ProfileDTO {
  userID: number;
  firstName: string;
  lastName: string;
  dob: string;
  avatarPath?: string | null;
  relationsCount?: RelationsCountDTO | null;
}

export interface ProfilePageParams {
  id?: string;
}

export interface ProfileTemplateUser {
  fullName: string;
  dobFormatted: string;
  age: number;
  avatarPath: string;
  isOwner: boolean;
}

export interface ProfileTemplateData {
  user: ProfileTemplateUser;
  showCancelRequest: boolean;
  showMessage: boolean;
  showAddFriend: boolean;
  showBlocked: boolean;
  friends: {
    count_friends: number;
    count_followers: number;
    count_follows: number;
    count_blocked: number;
  };
}

export type Gender = '' | 'male' | 'female' | 'other';

export interface ProfileFormData {
  id: number;
  firstName: string;
  lastName: string;
  avatarPath: string | null;
  aboutMyself: string;
  gender: Gender;
}
