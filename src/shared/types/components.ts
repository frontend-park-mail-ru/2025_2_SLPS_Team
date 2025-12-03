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
}

export interface NavButtonData {
    icon?: string;
    position?: string;
    onClick?: () => void;
}

export interface SelectInputConfig {
    header: string,
    placeholder: string,
    required: boolean,
    value: string,
    values?: [],
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

