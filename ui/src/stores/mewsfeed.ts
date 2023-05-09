import { getFeedMewAndContext, mewsFeed } from "@/services/mewsfeed-dna";
import { FeedMew } from "@/types/types";
import { isSameHash } from "@/utils/hash";
import { showError } from "@/utils/notification";
import { ActionHash } from "@holochain/client";
import { defineStore, Store } from "pinia";

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
  },
});

export type MewsfeedStore = Store<
  "mewsfeed",
  {
    mewsFeed: FeedMew[];
    isLoadingMewsFeed: boolean;
    fetchMewsFeed(): Promise<void>;
    reloadMew(actionHash: ActionHash): Promise<void>;
  }
>;
