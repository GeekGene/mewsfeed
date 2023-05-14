import { CallableCell } from "@holochain/tryorama";
import { ActionHash } from "@holochain/client";

export async function sampleMew(cell: CallableCell, partialMew = {}) {
  return {
    ...{
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      links: [],
      mew_type: { Original: null },
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
