import { TAG_SYMBOLS } from "@/types/types";

const regexpString = Object.values(TAG_SYMBOLS).map(
  (symbol) => `\\${symbol}\\S+`
);
export const TAG_REGEX = new RegExp(`\\B(${regexpString.join("|")})`, "gi");
