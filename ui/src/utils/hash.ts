export const isSameHash = (key1: Uint8Array, key2: Uint8Array) =>
  key1.every((byte, index) => key2[index] === byte);
