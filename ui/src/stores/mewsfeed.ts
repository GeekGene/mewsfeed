import {
  callZome,
  getFeedMewAndContext,
  mewsFeed,
  MewsFn,
} from "@/services/mewsfeed-dna";
import { CreateMewInput, FeedMew } from "@/types/types";
import { isSameHash } from "@/utils/hash";
import { showError } from "@/utils/notification";
import { ActionHash } from "@holochain/client";
import { defineStore } from "pinia";

export const MEWSFEED_ROLE_NAME = "mewsfeed";
export const MEWS_ZOME_NAME = "mews";

export const makeUseMewsfeedStore = () => {
  return defineStore("mewsfeed", {
    state: () => ({
      mewsFeed: [] as FeedMew[],
      isLoadingMewsFeed: false,
    }),
    actions: {
      async fetchMewsFeed() {
        try {
          this.isLoadingMewsFeed = true;
          this.mewsFeed = await mewsFeed({ option: "" });
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
          if (index !== -1) {
            this.mewsFeed[index] = await getFeedMewAndContext(actionHash);
          }
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
