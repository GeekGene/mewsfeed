export interface Profile {
    did: string,
    avatar: string, // base 64 in-place image url
    location: string,
    bio: string,
    lang_pref: string,
}

export interface NotificationOptions {
    color?: string;
    textColor?: string;
    message?: string;
    caption?: string;
    html?: boolean;
    icon?: string;
    position?:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "top"
    | "bottom"
    | "left"
    | "right"
    | "center";
    actions?: Array<() => void>;
    onDismiss?: () => void;
}