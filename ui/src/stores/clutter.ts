import {
  callZome,
  getFeedMewAndContext,
  mewsFeed,
  MewsFn,
  mewsTopList,
} from "@/services/clutter-dna";
import {
  CreateMewInput,
  FeedMew,
  TopMewsInteractions,
  TopMewsTimespans,
} from "@/types/types";
import { showError } from "@/utils/notification";
import { serializeHash } from "@holochain-open-dev/utils";
import { ActionHash } from "@holochain/client";
import { defineStore } from "pinia";

export const CLUTTER_ROLE_NAME = "clutter";
export const MEWS_ZOME_NAME = "mews";

export const makeUseClutterStore = () => {
  return defineStore("clutter", {
    state: () => ({
      mews: new Map<string, FeedMew>(),
      mewsFeedAh: [] as string[],
      topMewsAh: {
        licks: {
          day: [] as string[],
          week: [] as string[],
          month: [] as string[],
          year: [] as string[],
        },
        replies: {
          day: [] as string[],
          week: [] as string[],
          month: [] as string[],
          year: [] as string[],
        },
        mewmews: {
          day: [] as string[],
          week: [] as string[],
          month: [] as string[],
          year: [] as string[],
        },
        quotes: {
          day: [] as string[],
          week: [] as string[],
          month: [] as string[],
          year: [] as string[],
        },
      },
      isLoadingMewsFeed: false,
      isLoadingTop: {
        licks: false,
        replies: false,
        mewmews: false,
        quotes: false,
      },
    }),
    actions: {
      async fetchMewsFeed() {
        try {
          this.isLoadingMewsFeed = true;
          const response = await mewsFeed({ option: "" });

          this.mewsFeedAh = response.map((feedMew) => {
            const serializedAh = serializeHash(feedMew.actionHash);
            this.mews.set(serializedAh, feedMew);
            return serializedAh;
          });
        } catch (error) {
          showError(error);
        } finally {
          this.isLoadingMewsFeed = false;
        }
      },
      async fetchTopMews(interaction: TopMewsInteractions) {
        try {
          this.isLoadingTop[interaction] = true;

          const {
            day: mews_day,
            week: mews_week,
            month: mews_month,
            year: mews_year,
          } = await mewsTopList(interaction, 5);

          this.topMewsAh[interaction]["day"] = mews_day.map((feedMew) => {
            const hash = serializeHash(feedMew.actionHash);
            this.mews.set(hash, feedMew);
            return hash;
          });
          this.topMewsAh[interaction]["week"] = mews_week.map((feedMew) => {
            const hash = serializeHash(feedMew.actionHash);
            this.mews.set(hash, feedMew);
            return hash;
          });
          this.topMewsAh[interaction]["month"] = mews_month.map((feedMew) => {
            const hash = serializeHash(feedMew.actionHash);
            this.mews.set(hash, feedMew);
            return hash;
          });
          this.topMewsAh[interaction]["year"] = mews_year.map((feedMew) => {
            const hash = serializeHash(feedMew.actionHash);
            this.mews.set(hash, feedMew);
            return hash;
          });
        } catch (error) {
          showError(error);
        } finally {
          this.isLoadingTop[interaction] = false;
        }
      },
      async reloadMew(actionHash: ActionHash) {
        if (!this.mews.has(serializeHash(actionHash))) return;

        try {
          const response = await getFeedMewAndContext(actionHash);
          this.mews.set(serializeHash(actionHash), response);
        } catch (error) {
          showError(error);
        }
      },
      async createMew(mew: CreateMewInput) {
        return callZome(MewsFn.CreateMew, mew);
      },
      topMewsList(
        interaction: TopMewsInteractions,
        timespan: TopMewsTimespans
      ) {
        return this.topMewsAh[interaction][timespan]
          .map((actionHash) => this.mews.get(actionHash))
          .filter((x) => x !== undefined) as FeedMew[];
      },
    },
    getters: {
      mewsFeed: (state) =>
        [...state.mewsFeedAh.values()]
          .map((actionHash) => state.mews.get(actionHash))
          .filter((x) => x !== undefined) as FeedMew[],
    },
  });
};
