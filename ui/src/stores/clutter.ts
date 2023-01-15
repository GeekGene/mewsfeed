import {
  callZome,
  getFeedMewAndContext,
  mewsFeed,
  MewsFn,
  mostLickedMewsRecently,
} from "@/services/clutter-dna";
import { CreateMewInput, FeedMew } from "@/types/types";
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
      mewsFeedAh: new Set<string>([]),
      mostLickedMewsTodayAh: new Set<string>([]),
      mostLickedMewsThisWeekAh: new Set<string>([]),
      mostLickedMewsThisMonthAh: new Set<string>([]),
      mostLickedMewsThisYearAh: new Set<string>([]),
      isLoadingMewsFeed: false,
      isLoadingMostLickedMewsRecently: false,
    }),
    actions: {
      async fetchMewsFeed() {
        try {
          this.isLoadingMewsFeed = true;
          const response = await mewsFeed({ option: "" });

          response.forEach((feedMew) => {
            const serializedAh = serializeHash(feedMew.actionHash);
            this.mews.set(serializedAh, feedMew);
            this.mewsFeedAh.add(serializedAh);
          });
        } catch (error) {
          showError(error);
        } finally {
          this.isLoadingMewsFeed = false;
        }
      },
      async fetchMostLickedMewsRecently() {
        try {
          this.isLoadingMostLickedMewsRecently = true;
          const [
            mostLickedMewsToday,
            mostLickedMewsThisWeek,
            mostLickedMewsThisMonth,
            mostLickedMewsThisYear,
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
          mostLickedMewsToday.forEach((feedMew) => {
            const serializedAh = serializeHash(feedMew.actionHash);

            this.mews.set(serializedAh, feedMew);
            this.mostLickedMewsTodayAh.add(serializedAh);
          });
          mostLickedMewsThisWeek.forEach((feedMew) => {
            const serializedAh = serializeHash(feedMew.actionHash);

            this.mews.set(serializedAh, feedMew);
            this.mostLickedMewsThisWeekAh.add(serializedAh);
          });
          mostLickedMewsThisMonth.forEach((feedMew) => {
            const serializedAh = serializeHash(feedMew.actionHash);

            this.mews.set(serializedAh, feedMew);
            this.mostLickedMewsThisMonthAh.add(serializedAh);
          });
          mostLickedMewsThisYear.forEach((feedMew) => {
            const serializedAh = serializeHash(feedMew.actionHash);

            this.mews.set(serializedAh, feedMew);
            this.mostLickedMewsThisYearAh.add(serializedAh);
          });
        } catch (error) {
          showError(error);
        } finally {
          this.isLoadingMostLickedMewsRecently = false;
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
    },
    getters: {
      mewsFeed: (state) =>
        [...state.mewsFeedAh.values()]
          .map((actionHash) => state.mews.get(actionHash))
          .filter((x) => x !== undefined) as FeedMew[],
      mostLickedMewsToday: (state) =>
        [...state.mostLickedMewsTodayAh]
          .map((actionHash) => state.mews.get(actionHash))
          .filter((x) => x !== undefined) as FeedMew[],
      mostLickedMewsThisWeek: (state) =>
        [...state.mostLickedMewsThisWeekAh]
          .map((actionHash) => state.mews.get(actionHash))
          .filter((x) => x !== undefined) as FeedMew[],
      mostLickedMewsThisMonth: (state) =>
        [...state.mostLickedMewsThisMonthAh]
          .map((actionHash) => state.mews.get(actionHash))
          .filter((x) => x !== undefined) as FeedMew[],
      mostLickedMewsThisYear: (state) =>
        [...state.mostLickedMewsThisYearAh]
          .map((actionHash) => state.mews.get(actionHash))
          .filter((x) => x !== undefined) as FeedMew[],
    },
  });
};
