import {
  ActionHash,
  AgentPubKey,
  Create,
  SigningCredentials,
} from "@holochain/client";
import { RouteLocationNamedRaw, RouteLocationRaw } from "vue-router";
import { Profile } from "@holochain-open-dev/profiles";

export const PROFILE_FIELDS = {
  DISPLAY_NAME: "Display name",
  BIO: "Bio",
  LOCATION: "Location",
};

export enum LinkTargetName {
  Mention = "Mention",
  Url = "Url",
  Record = "Record",
}

export interface MentionLinkTarget {
  [LinkTargetName.Mention]: AgentPubKey;
}

export interface UrlLinkTarget {
  [LinkTargetName.Url]: string;
}

export interface RecordLinkTarget {
  [LinkTargetName.Record]: ActionHash;
}

export type LinkTarget = MentionLinkTarget | UrlLinkTarget | RecordLinkTarget;

export type Mew = {
  text: string | null;
  links: LinkTarget[];
  mew_type: MewType;
};

export enum MewTagType {
  Mention,
  Link,
  RawUrl,
  Cashtag,
  Hashtag,
}

export interface MewContentPart {
  text: string;
  route?: RouteLocationNamedRaw;
  href?: string;
  tagType?: MewTagType;
}

export enum MewTypeName {
  Original = "Original",
  Reply = "Reply",
  Mewmew = "Mewmew",
  Quote = "Quote",
}

export type MewType =
  | MewTypeName.Original
  | {
      [MewTypeName.Reply]: ActionHash;
    }
  | {
      [MewTypeName.Mewmew]: ActionHash;
    }
  | {
      [MewTypeName.Quote]: ActionHash;
    };

export interface FeedMew {
  mew: Mew;
  action: Create;
  action_hash: ActionHash;
  replies_count: number;
  quotes_count: number;
  licks_count: number;
  mewmews_count: number;
  is_pinned: boolean;
  is_licked: boolean;
  is_mewmewed: boolean;
  is_replied: boolean;
  is_quoted: boolean;
  author_profile: Profile | null;
  deleted_timestamp: number | null;
  original_mew: EmbedMew | null;
}

export interface EmbedMew {
  mew: Mew;
  action: Create;
  action_hash: ActionHash;
  author_profile: Profile | null;
  deleted_timestamp: number | null;
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

export enum SearchResult {
  Agent,
  Hashtag,
  Cashtag,
}

export interface ElementWithInnerText extends Element {
  innerText: string;
}

export interface SigningCredentialsJson
  extends Omit<SigningCredentials, "capSecret" | "keyPair" | "signingKey"> {
  capSecret: number[];
  keyPair: {
    publicKey: number[];
    secretKey: number[];
  };
  signingKey: number[];
}

export interface MewsfeedDnaProperties {
  mew_characters_min: number | null;
  mew_characters_max: number | null;
}

export type SearchResultOption = {
  value: RouteLocationRaw;
  label: string;
  agentPubKey?: AgentPubKey;
  resultType: SearchResult;
};

export type AgentProfile = {
  agentPubKey: AgentPubKey;
  profile: Profile;
};

export type NotificationKey = {
  notificationType: NotificationType;
  timestamp: number;
  agent: AgentPubKey;
  mewActionHash: ActionHash | null;
};

export type Notification = {
  notification_type: NotificationType;
  timestamp: number;
  agent: AgentPubKey;
  agent_profile: Profile | null;
  feed_mew: FeedMew | null;
};

export enum NotificationTypeName {
  MyMewLicked = "MyMewLicked",
  MyMewUnlicked = "MyMewUnlicked",
  MyMewPinned = "MyMewPinned",
  MyMewUnpinned = "MyMewUnpinned",
  MyMewResponded = "MyMewResponded",
  MyAgentMentioned = "MyAgentMentioned",
  MyAgentFollowed = "MyAgentFollowed",
  MyAgentUnfollowed = "MyAgentUnfollowed",
  FollowedYarnResponded = "FollowedYarnResponded",
}

export type NotificationType =
  | NotificationTypeName.MyMewLicked
  | NotificationTypeName.MyMewUnlicked
  | NotificationTypeName.MyMewPinned
  | NotificationTypeName.MyMewUnpinned
  | NotificationTypeName.MyMewResponded
  | NotificationTypeName.MyAgentMentioned
  | NotificationTypeName.MyAgentMentioned
  | NotificationTypeName.MyAgentFollowed
  | NotificationTypeName.MyAgentUnfollowed
  | NotificationTypeName.FollowedYarnResponded;

export declare type CacheData<R = any, P = any> = {
  data: R;
  params: P;
  time: number;
};

export type HashPagination = {
  after_hash?: Uint8Array | null;
  direction?: PaginationDirectionType | null;
  limit: number;
};

export type TimestampPagination = {
  after_timestamp?: number | null;
  direction?: PaginationDirectionType | null;
  limit: number;
};

export type PaginationDirectionType =
  | { [PaginationDirectionName.Ascending]: null }
  | { [PaginationDirectionName.Descending]: null };

export enum PaginationDirectionName {
  Ascending = "Ascending",
  Descending = "Descending",
}

export type LoadMoreDataType = {
  list: any[];
  [key: string]: any;
  nextPage: HashPagination;
  noMore: boolean;
};

export type ToastMessageType = "error" | "warning" | "info" | "success";
export type ToastMessage = {
  id: string;
  type: ToastMessageType;
  text: string;
};
