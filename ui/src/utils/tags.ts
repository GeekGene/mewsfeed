export const TAG_SYMBOLS = {
  CASHTAG: "$",
  HASHTAG: "#",
  MENTION: "@",
  URL: "^",
};

const regexpString = [
  `\\B\\${TAG_SYMBOLS.CASHTAG}\\w+`,
  `\\B\\${TAG_SYMBOLS.HASHTAG}\\w+`,
  `\\B\\${TAG_SYMBOLS.MENTION}\\S+`,
  `\\B\\${TAG_SYMBOLS.URL}\\[[\\S ]+\\]`, // multi-word labeled url
  `\\B\\${TAG_SYMBOLS.URL}\\S+`, // single-word labeled url
];

export const TAG_REGEX = new RegExp(`${regexpString.join("|")}`, "mi");

export const RAW_URL_REGEX =
  /\b(?:(?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()[\]{};:'".,<>?«»“”‘’]))/;

export const TAG_OR_RAW_URL_REGEX = new RegExp(
  `(${[...regexpString, RAW_URL_REGEX.source].join("|")})`,
  "mi"
);

export const isTag = (text: string): boolean => TAG_REGEX.test(text);

export const isRawUrl = (text: string): boolean => RAW_URL_REGEX.test(text);

export const splitMewTextIntoParts = (text: string): string[] =>
  text
    .split(TAG_OR_RAW_URL_REGEX)
    .filter((part) => part !== undefined && part.length > 0);
