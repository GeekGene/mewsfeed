import { ActionHash, AgentPubKey, Create, HoloHash } from "@holochain/client";

export enum MewsFn {
  CreateMew = 'create_mew',
  GetMew = 'get_mew',
  MewsFeed = 'mews_feed',
  MewsBy = 'mews_by',
  Follow = 'follow',
  Followers = 'followers',
  Following = 'following',
  MyFollowers = 'my_followers',
  MyFollowing = 'my_following',
  Unfollow = 'unfollow',
  LickMew = 'lick_mew',
  UnlickMew = 'unlick_mew',
  MyLicks = 'my_licks',
  GetFeedMewAndContext = 'get_feed_mew_and_context',
  GetMewsWithCashtag = 'get_mews_with_cashtag',
  GetMewsWithHashtag = 'get_mews_with_hashtag',
  GetMewsWithMention = 'get_mews_with_mention',
}


export const PROFILE_FIELDS = {
  DISPLAY_NAME: "Display name",
  BIO: "Bio",
  LOCATION: "Location",
};

export enum LinkTargetName {
  Mention = "Mention",
}

export type LinkTarget = {
  [LinkTargetName.Mention]: AgentPubKey;
};

export type CreateMewInput = {
  mewType: MewType;
  text: string | null;
  links?: LinkTarget[];
};

export interface MewContent {
  text: string;
  links?: LinkTarget[];
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