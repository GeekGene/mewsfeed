import { serializeHash } from "@holochain-open-dev/core-types";

export const authorPubKey = (author: unknown) => {
  if (author instanceof Uint8Array) {
    return serializeHash(author);
  }
  throw new Error("AgentPubKey is not Uint8Array");
};

export const entryHash = (hash: unknown) => {
  if (hash instanceof Uint8Array) {
    return serializeHash(hash);
  }
  throw new Error("EntryHash is not Uint8Array");
};
