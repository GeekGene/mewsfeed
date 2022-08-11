import { ActionHash, AgentPubKey, Create, HoloHash } from "@holochain/client";

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
      [MewTypeName.Reply]: ActionHash;
    }
  | {
      [MewTypeName.MewMew]: ActionHash;
    }
  | {
      [MewTypeName.Quote]: ActionHash;
    };

export interface Mew {
  mewType: MewType;
  content: MewContent | null;
}

export interface FeedMew {
  mew: Mew;
  action: Create;
  actionHash: ActionHash;
  replies: HoloHash[];
  quotes: HoloHash[];
  licks: AgentPubKey[];
  mewmews: HoloHash[];
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
