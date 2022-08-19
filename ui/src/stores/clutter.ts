import { callZome, MewsFn } from "@/services/clutter-dna";
import { CreateMewInput, FeedMew } from "@/types/types";
import { showError } from "@/utils/notification";
import { defineStore } from "pinia";

export const CLUTTER_ROLE_ID = "clutter";
export const MEWS_ZOME_NAME = "mews";

export const makeUseClutterStore = () => {
  return defineStore("clutter", {
    state: () => ({ mewsFeed: [] as FeedMew[], isLoadingMewsFeed: false }),
    actions: {
      async fetchMewsFeed() {
        try {
          this.isLoadingMewsFeed = true;
          this.mewsFeed = await callZome(MewsFn.MewsFeed, {
            option: "",
          });
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
