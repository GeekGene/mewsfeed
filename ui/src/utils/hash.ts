import { serializeHash } from "@holochain-open-dev/core-types";

export const getUrlSafeAgentPubKey = (author: unknown) => {
  if (author instanceof Uint8Array) {
    return serializeHash(author);
  }
  throw new TypeError("AgentPubKey is not Uint8Array");
};
