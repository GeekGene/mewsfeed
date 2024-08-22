
import { assert, expect, it } from "vitest";
import { encode, decode } from "@msgpack/msgpack";
import { MewTypeName } from "../../../../ui/src/types/types";

it("msgpack", async () => {
  console.log(decode([147, 164, 98, 108, 97, 104, 144, 161, 65]));

  console.log(encode({
    text: 'blah',
    links: [],
    mew_type: { type: MewTypeName.Original},
  }))
});