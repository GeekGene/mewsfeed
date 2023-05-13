import { FeedMew } from "@/types/types";
import isEqual from "lodash/isEqual";
import { showError } from "@/utils/notification";
import { ActionHash, AppAgentClient } from "@holochain/client";
import { defineStore, Store } from "pinia";

export const useMewsfeedStore = defineStore("mewsfeed", {
  state: () => ({
    mewsFeed: [] as FeedMew[],
    isLoadingMewsFeed: false,
  }),
  actions: {
    async fetchMewsFeed(client: AppAgentClient) {
      try {
        this.isLoadingMewsFeed = true;
        this.mewsFeed = await client.callZome({
          role_name: "mewsfeed",
          zome_name: "mews",
          fn_name: "get_my_followed_creators_mews_with_context",
          payload: null,
        });
      } catch (error) {
        showError(error);
      } finally {
        this.isLoadingMewsFeed = false;
      }
    },
    async reloadMew(client: AppAgentClient, actionHash: ActionHash) {
      try {
        const index = this.mewsFeed.findIndex((mew) =>
          isEqual(actionHash, mew.action_hash)
        );
        if (index !== -1) {
          this.mewsFeed[index] = await client.callZome({
            role_name: "mewsfeed",
            zome_name: "mews",
            fn_name: "get_mew_with_context",
            payload: actionHash,
          });
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
    fetchMewsFeed(client: AppAgentClient): Promise<void>;
    reloadMew(client: AppAgentClient, actionHash: ActionHash): Promise<void>;
  }
>;
