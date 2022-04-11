import assert from "assert";
import { serializeHash } from "@holochain-open-dev/core-types";

export const authorPubKey = (author: unknown) => {
  assert(author instanceof Uint8Array, "AgentPubKey is not Uint8Array");
  return serializeHash(author);
};
