export const TAG_SYMBOLS = {
  CASHTAG: "$",
  HASHTAG: "#",
  MENTION: "@",
};

const regexpString = [
  `\\${TAG_SYMBOLS.CASHTAG}\\w+`,
  `\\${TAG_SYMBOLS.HASHTAG}\\w+`,
  `\\${TAG_SYMBOLS.MENTION}\\S+`,
];
export const TAG_REGEX = new RegExp(`\\B(${regexpString.join("|")})`, "gi");
