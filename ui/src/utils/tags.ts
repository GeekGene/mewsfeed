import { ROUTES } from "@/router";
import {
  LinkTarget,
  LinkTargetName,
  MentionLinkTarget,
  MewContentPart,
  MewTagType,
  UrlLinkTarget,
} from "@/types/types";
import { AgentPubKey, encodeHashToBase64 } from "@holochain/client";
import { RouteLocationRaw } from "vue-router";

export const TAG_SYMBOLS = {
  CASHTAG: "$",
  HASHTAG: "#",
  MENTION: "@",
  LINK: "^",
};

const MENTION_TAG_REGEX_STRING = `\\B\\${TAG_SYMBOLS.MENTION}\\S+`;
const MENTION_TAG_REGEX = new RegExp(MENTION_TAG_REGEX_STRING, "mi");

const LINK_TAG_REGEX_STRING = `\\B\\${TAG_SYMBOLS.LINK}\\S+`;
const LINK_TAG_REGEX = new RegExp(LINK_TAG_REGEX_STRING, "mi");

const CASH_TAG_REGEX_STRING = `\\B\\${TAG_SYMBOLS.CASHTAG}\\w+`;
const CASH_TAG_REGEX = new RegExp(CASH_TAG_REGEX_STRING, "mi");

const HASH_TAG_REGEX_STRING = `\\B\\${TAG_SYMBOLS.HASHTAG}\\w+`;
const HASH_TAG_REGEX = new RegExp(HASH_TAG_REGEX_STRING, "mi");

const regexpString = [
  CASH_TAG_REGEX.source,
  HASH_TAG_REGEX.source,
  MENTION_TAG_REGEX.source,
  LINK_TAG_REGEX.source, // single-word labeled url
];

export const TAG_REGEX = new RegExp(`${regexpString.join("|")}`, "mi");

export const RAW_URL_REGEX =
  /\b(?:(?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()[\]{};:'".,<>?«»“”‘’]))/;

export const TAG_OR_RAW_URL_REGEX = new RegExp(
  `(${[...regexpString, RAW_URL_REGEX.source].join("|")})`,
  "mi"
);

export const isTag = (text: string): boolean => TAG_REGEX.test(text);
export const isHashtag = (text: string): boolean => HASH_TAG_REGEX.test(text);
export const isCashtag = (text: string): boolean => CASH_TAG_REGEX.test(text);

export const isMentionTag = (text: string): boolean =>
  MENTION_TAG_REGEX.test(text);

export const isLinkTag = (text: string): boolean => LINK_TAG_REGEX.test(text);

export const isRawUrl = (text: string): boolean => RAW_URL_REGEX.test(text);
