import { CallableCell } from "@holochain/tryorama";
import { ActionHash } from "@holochain/client";
import { MewTypeName } from "../../../../ui/src/types/types";

export async function sampleMew(cell: CallableCell, partialMew = {}) {
  return {
    ...{
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      links: [],
      mew_type: { type: MewTypeName.Original },
    },
    ...partialMew,
  };
}

export async function createMew(
  cell: CallableCell,
  mew = undefined
): Promise<ActionHash> {
  return cell.callZome({
    zome_name: "mews",
    fn_name: "create_mew",
    payload: mew || (await sampleMew(cell)),
  });
}
