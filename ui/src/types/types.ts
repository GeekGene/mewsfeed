import { Header } from '@holochain-open-dev/core-types';
import { HoloHashB64 } from '@holochain/client';

export interface Profile {
    avatar: string, // base 64 in-place image url
    location: string,
    bio: string,
    lang_pref: string,
}

export type Mew = string;

export interface FeedMew {
    entry: string,
    header: Header,
    id: HoloHashB64
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