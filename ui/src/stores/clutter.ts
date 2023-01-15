import {
  callZome,
  getFeedMewAndContext,
  mewsFeed,
  MewsFn,
  mostLickedMewsRecently,
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
      mostLickedMewsToday: [] as FeedMew[],
      mostLickedMewsThisWeek: [] as FeedMew[],
      mostLickedMewsThisMonth: [] as FeedMew[],
      mostLickedMewsThisYear: [] as FeedMew[],
      isLoadingMewsFeed: false,
      isLoadingMostLickedMewsRecently: false,
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
      async fetchMostLickedMewsRecently() {
        try {
          this.isLoadingMostLickedMewsRecently = true;
          [
            this.mostLickedMewsToday,
            this.mostLickedMewsThisWeek,
            this.mostLickedMewsThisMonth,
            this.mostLickedMewsThisYear,
          ] = await Promise.all([
            mostLickedMewsRecently({
              count: 5,
              from_hours_ago: 24,
            }),
            mostLickedMewsRecently({
              count: 5,
              from_hours_ago: 24 * 7,
            }),
            mostLickedMewsRecently({
              count: 5,
              from_hours_ago: 24 * 31,
            }),
            mostLickedMewsRecently({
              count: 5,
              from_hours_ago: 24 * 365,
            }),
          ]);
        } catch (error) {
          showError(error);
        } finally {
          this.isLoadingMostLickedMewsRecently = false;
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
