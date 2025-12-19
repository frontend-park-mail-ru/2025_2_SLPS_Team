export interface BaseButtonConfig {
    text?: string;
    style?: string;
    onClick?: (event: MouseEvent) => void | Promise<void> | null;
}

export interface BaseInputConfig {
    header?: string;
    type?: string;
    placeholder?: string;
    autocomplete?: string;
    maxLength?: number;
    required?: boolean;
    value?: string;
    isBig?: boolean;
}

export interface DropDownOption {
    label: string;
    value?: any;
    icon?: string;
    onClick?: (option: DropDownOption) => void;
}

export interface DropDownConfig {
    values?: DropDownOption[];
}

export interface FormInputConfig {
    type?: string;
    placeholder?: string;
    autocomplete?: string;
    maxLength?: number;
    required?: boolean;
    value?: string;
    name?: string;
    validation?: string;
    label?: string;
    showRequired?: boolean
}

export interface MenuItemOptions {
    label: string;
    view: string;
    icon?: string | null;
    isActive?: boolean;
    onClick?: (view: string) => void;
}

export interface MessageData {
    id?: string | number;
    text: string;
    created_at?: string | Date;
    attachments?: string[];
}

export interface NavButtonData {
    icon?: string;
    position?: string;
    onClick?: () => void;
}

export interface SelectOption {
  label: string;
  value: string;
  active?: boolean;
}

export interface SelectInputConfig {
    header: string,
    placeholder: string,
    required: boolean,
    value: string,
    values?: SelectOption[],
    pressedStyle: boolean,
}

export interface ChatMessage {
    id: number;
    authorID: number;
    chatID: number;
    text: string;
    createdAt: string;
}

export interface ChatUser {
    userID: number;
    fullName: string;
    avatarPath: string;
    dob: string;
}

export interface ChatItemData {
    id: number;
    isGroup: boolean;
    avatarPath: string;
    name: string;

    lastMessage?: ChatMessage | null;
    lastMessageAuthor?: ChatUser | null;

    lastReadMessageID?: number;
    lastReadMessageId?: number;

    unReadCounts?: number;
    unreadCount?: number;
}

export interface Community {
  id: number;
  name: string;
  avatar: string;
}

export type NotificationIconStyle = 'success' | 'error' | 'info' | 'warning';

export interface ProfileData {
  userID?: number;
  firstName?: string;
  lastName?: string;

  avatarPath?: string | null;
  headerPath?: string | null;

  fullName: string;
  aboutMyself: string;
  dob: string;
  gender: string;
}

export type CreatePostMode = 'create' | 'edit';

export interface CreatePostFormOptions {
  ownerId: number | null;
  mode: CreatePostMode;
  postId?: number;
  communityId?: number;
}

export type ModalVoidCallback = () => void;

export interface CommunityEntity {
  id: number;
  name?: string;
  description?: string;
  avatarPath?: string | null;
  [key: string]: unknown;
}

export interface EditCommunitySubmitPayload {
  name: string;
  about: string;
}

export interface EditCommunityInitialFormData {
  name?: string;
  description?: string;
  avatarPath?: string | null;
}

export interface EditCommunityModalCallbacks {
  onSubmit?: (data: EditCommunitySubmitPayload) => void;
  onCancel?: ModalVoidCallback;
  onSuccess?: (freshCommunity: CommunityEntity) => void;
}

export interface EditCommunityModalOptions extends EditCommunityModalCallbacks {
  communityId?: number;
  FormData?: EditCommunityInitialFormData;
}

export interface AvatarState {
  defaultAvatar: string;
  hasCustomAvatar: boolean;
  avatarDeleted: boolean;
  currentAvatarBlob: string | null;
}