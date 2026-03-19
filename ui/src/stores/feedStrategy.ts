import { defineStore } from "pinia";

export type FeedStrategyType = "batch" | "progressive";

export const useFeedStrategyStore = defineStore("feedStrategy", {
  persist: true,
  state: () => ({
    strategy: "batch" as FeedStrategyType,
  }),
  actions: {
    setStrategy(s: FeedStrategyType) {
      this.strategy = s;
    },
    toggle() {
      this.strategy = this.strategy === "batch" ? "progressive" : "batch";
    },
  },
});
