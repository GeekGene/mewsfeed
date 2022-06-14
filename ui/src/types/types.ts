import { EntryHashB64, HeaderHashB64 } from "@holochain-open-dev/core-types";
import { Create, Header } from "@holochain/client";

export const TAG_SYMBOLS = {
  CASHTAG: "$",
  HASHTAG: "#",
  MENTION: "@",
};

export interface Profile {
  avatar: string; // Base64 in-place image url
  location: string;
  bio: string;
  lang_pref: string;
}

export type CreateMewInput = {
  mewType: MewType;
  text: string | null;
};

export interface MewContent {
  text: string;
}

export enum MewTypeName {
  Original = "original",
  Reply = "reply",
  MewMew = "mewMew",
  Quote = "quote",
}

export type MewType =
  | {
      [MewTypeName.Original]: null;
    }
  | {
      [MewTypeName.Reply]: HeaderHashB64;
    }
  | {
      [MewTypeName.MewMew]: HeaderHashB64;
    }
  | {
      [MewTypeName.Quote]: HeaderHashB64;
    };

export interface Mew {
  mewType: MewType;
  content: MewContent | null;
}

export interface FeedMew {
  mew: Mew;
  header: Create;
  headerHash: HeaderHashB64;
  mewEntryHash: EntryHashB64;
  replies: string[];
  quotes: string[];
  licks: string[];
  mewmews: string[];
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
  option: string;
}
