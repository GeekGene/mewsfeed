import { EntryHashB64 } from "@holochain-open-dev/core-types";
import { Header } from "@holochain/client";

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

export type Mew = string;

export type CreateMewInput = {
  mewType: MewTypeInput;
  mew: string | null;
};

export type MewTypeInput =
  | {
      original: null;
    }
  | {
      reply: EntryHashB64;
    }
  | {
      reMew: EntryHashB64;
    }
  | {
      mewMew: EntryHashB64;
    };

export interface MewContent {
  mew: string;
}

export type MewType =
  | {
      original: null;
    }
  | {
      reply: EntryHashB64;
    }
  | {
      reMew: EntryHashB64;
    }
  | {
      mewMew: EntryHashB64;
    };

export interface FullMew {
  mewType: MewType;
  mew: MewContent | null;
}

export interface FeedMew {
  mew: FullMew;
  header: Header;
}

export interface FeedMewWithContext {
  feedMew: FeedMew;
  mewEntryHash: EntryHashB64;
  comments: string[];
  shares: string[];
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
