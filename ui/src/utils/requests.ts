import { encodeHashToBase64, decodeHashFromBase64 } from "@holochain/client";
import { encode, decode } from "@msgpack/msgpack";

export const localStorageCacheSettings = {
  setCache: (cacheKey: string, cacheData: any): void => {
    localStorage.setItem(cacheKey, encodeHashToBase64(encode(cacheData)));
  },
  getCache: (cacheKey: string): any => {
    const value = localStorage.getItem(cacheKey);
    if (!value) return;

    return decode(decodeHashFromBase64(value));
  },
};
