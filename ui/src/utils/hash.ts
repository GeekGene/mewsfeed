import { serializeHash } from "@holochain-open-dev/core-types";

export const authorPubKey = (author: unknown) => {
    if (author instanceof Uint8Array) {
        console.log('author buff', author);
        return serializeHash(author);
    }
    else if ("data" in author && author.type === "Buffer") {
        return serializeHash(new Uint8Array(author.data));
    }
    throw new Error("AgentPubKey is not Uint8Array");
};

export const entryHash = (hash: unknown) => {
    if (hash instanceof Uint8Array) {
        return serializeHash(hash);
    }
    throw new Error("EntryHash is not Uint8Array");
};