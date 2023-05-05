import {
  callZome,
  getFeedMewAndContext,
  mewsFeed,
  MewsFn,
} from "@/services/mewsfeed-dna";
import { Mew, FeedMew } from "@/types/types";
import { isSameHash } from "@/utils/hash";
import { showError } from "@/utils/notification";
import { ActionHash } from "@holochain/client";
import { defineStore } from "pinia";

export const useMewsfeedStore = defineStore("mewsfeed", {
  state: () => ({
    mewsFeed: [] as FeedMew[],
    isLoadingMewsFeed: false,
  }),
  actions: {
    async fetchMewsFeed() {
      try {
        this.isLoadingMewsFeed = true;
        this.mewsFeed = await mewsFeed();
      } catch (error) {
        showError(error);
      } finally {
        this.isLoadingMewsFeed = false;
      }
    },
    async reloadMew(actionHash: ActionHash) {
      try {
        const index = this.mewsFeed.findIndex((mew) =>
          isSameHash(actionHash, mew.action_hash)
        );
        if (index !== -1) {
          this.mewsFeed[index] = await getFeedMewAndContext(actionHash);
        }
      } catch (error) {
        showError(error);
      }
    },
    async createMew(mew: Mew) {
      return callZome(MewsFn.CreateMew, mew);
    },
  },
});
