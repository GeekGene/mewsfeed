import { MewsFn } from "@/services/clutter-dna";
import { CreateMewInput, FeedMew } from "@/types/types";
import { showError } from "@/utils/notification";
import { CallZomeRequest } from "@holochain/client";
import { defineStore } from "pinia";
import { ClientStore } from ".";

export const CLUTTER_ROLE_ID = "clutter";
export const MEWS_ZOME_NAME = "mews";

export const makeUseClutterStore = ({
  useClientStore,
}: {
  useClientStore: ClientStore;
}) => {
  const callZome = async (
    fnName: CallZomeRequest["fn_name"],
    payload: CallZomeRequest["payload"]
  ) =>
    useClientStore().callZome({
      roleId: CLUTTER_ROLE_ID,
      zomeName: MEWS_ZOME_NAME,
      fnName,
      payload,
    });

  return defineStore("clutter", {
    state: () => ({ mewsFeed: [] as FeedMew[], isLoadingMewsFeed: false }),
    actions: {
      async fetchMewsFeed() {
        try {
          this.isLoadingMewsFeed = true;
          this.mewsFeed = await callZome(MewsFn.MewsFeed, { option: "" });
        } catch (error) {
          showError(error);
        } finally {
          this.isLoadingMewsFeed = false;
        }
      },
      async createMew(mew: CreateMewInput) {
        return callZome(MewsFn.CreateMew, mew);
      },
    },
  });
};
