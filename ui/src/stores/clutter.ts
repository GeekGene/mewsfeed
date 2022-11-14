import { callZome, getFeedMewAndContext, MewsFn } from "@/services/clutter-dna";
import { CreateMewInput, FeedMew } from "@/types/types";
import { isSameHash } from "@/utils/hash";
import { showError } from "@/utils/notification";
import { ActionHash } from "@holochain/client";
import { defineStore } from "pinia";

export const CLUTTER_ROLE_ID = "clutter";
export const MEWS_ZOME_NAME = "mews";

export const makeUseClutterStore = () => {
  return defineStore("clutter", {
    state: () => ({
      mewsFetcher: () => Promise.resolve([] as FeedMew[]),
      mewsFeed: [] as FeedMew[],
      isLoadingMewsFeed: false,
    }),
    actions: {
      async fetchMewsFeed() {
        try {
          this.isLoadingMewsFeed = true;
          this.mewsFeed = await this.mewsFetcher();
        } catch (error) {
          showError(error);
        } finally {
          this.isLoadingMewsFeed = false;
        }
      },
      async reloadMew(actionHash: ActionHash) {
        try {
          const index = this.mewsFeed.findIndex((mew) =>
            isSameHash(actionHash, mew.actionHash)
          );
          if (index === -1) {
            return false;
          }
          this.mewsFeed[index] = await getFeedMewAndContext(actionHash);
          return true;
        } catch (error) {
          showError(error);
        }
      },
      async createMew(mew: CreateMewInput) {
        return callZome(MewsFn.CreateMew, mew);
      },
    },
  });
};
