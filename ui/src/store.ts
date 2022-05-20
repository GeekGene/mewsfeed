import { defineStore } from "pinia";
import { mewsFeed } from "./services/clutter-dna";
import { FeedMew } from "./types/types";
import { showError } from "./utils/notification";

export const useStore = defineStore("main", {
  state: () => ({ mewsFeed: [] as FeedMew[], isLoadingMewsFeed: false }),
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
  },
});
