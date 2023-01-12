import {
  callZome,
  getFeedMewAndContext,
  mewsFeed,
  MewsFn,
  mostLickedMewsFeed,
} from "@/services/clutter-dna";
import { CreateMewInput, FeedMew } from "@/types/types";
import { isSameHash } from "@/utils/hash";
import { showError } from "@/utils/notification";
import { ActionHash } from "@holochain/client";
import { defineStore } from "pinia";

export const CLUTTER_ROLE_NAME = "clutter";
export const MEWS_ZOME_NAME = "mews";

export const makeUseClutterStore = () => {
  return defineStore("clutter", {
    state: () => ({
      mewsFeed: [] as FeedMew[],
      mostLickedMewsFeed: [] as FeedMew[],
      isLoadingMewsFeed: false,
      isLoadingMostLickedMewsFeed: false,
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
      async fetchMostLickedMewsFeed(count: number) {
        try {
          this.isLoadingMostLickedMewsFeed = true;
          this.mostLickedMewsFeed = await mostLickedMewsFeed(count);
        } catch (error) {
          showError(error);
        } finally {
          this.isLoadingMostLickedMewsFeed = false;
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
