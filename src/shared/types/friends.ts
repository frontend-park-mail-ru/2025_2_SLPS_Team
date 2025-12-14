export type FriendsListType = 'friends' | 'subscribers' | 'possible';

export type FriendsSearchBackendType = 'accepted' | 'pending' | 'notFriends';

export interface ProfileDTO {
  userID: number;
  fullName: string;
  avatarPath?: string | null;
  dob?: string | null;
}

export interface FriendListItem {
  userID: number;
  name: string;
  avatarPath: string | null;
  age: number | null;
  type: FriendsListType;
}

export type FriendsData = Record<FriendsListType, FriendListItem[]>;

export const SEARCH_TYPES_BY_LIST: Record<FriendsListType, FriendsSearchBackendType> = {
  friends: 'accepted',
  subscribers: 'pending',
  possible: 'notFriends',
};
export type FriendStatus = '' | 'pending' | 'accepted' | 'blocked' | 'sent';

export interface FriendsCount {
  count_friends: number;
  count_followers: number;
  count_follows: number;
  count_blocked: number;
}