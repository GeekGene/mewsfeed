import { Header } from '@holochain-open-dev/core-types';

export interface Profile {
    avatar: string, // base 64 in-place image url
    location: string,
    bio: string,
    lang_pref: string,
}

export type Mew = string;

export interface MewContent {
    mew: string
}

export type MewType = 
| {
    original: MewContent
}

export interface FullMew {
    mew_type: MewType,
    mew: MewContent | null
}

export interface FeedMew {
    mew: FullMew,
    header: Header,
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

export interface FeedOptions {
    options: string
}