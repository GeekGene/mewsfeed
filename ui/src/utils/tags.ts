export const TAG_SYMBOLS = {
  CASHTAG: "$",
  HASHTAG: "#",
  MENTION: "@",
  URL: "^",
};

const regexpString = [
  `\\${TAG_SYMBOLS.CASHTAG}\\w+`,
  `\\${TAG_SYMBOLS.HASHTAG}\\w+`,
  `\\${TAG_SYMBOLS.MENTION}\\S+`,
  `\\${TAG_SYMBOLS.URL}\\S+`,
];
export const TAG_REGEX = new RegExp(`\\B(${regexpString.join("|")})`, "gi");
