export interface BaseButtonConfig {
    text?: string;
    style?: string;
    onClick?: (event: MouseEvent) => void | null;
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
