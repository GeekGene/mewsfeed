<template>
  <QPage class="q-pb-lg" :style-fn="pageHeightCorrection">
    <CreateMewField
      :mew-type="{ [MewTypeName.Original]: null }"
      @publish-mew="fetchMew"
    />

    <BaseMewList
      title="Your Mews Feed"
      :feed-mews="data || []"
      :is-loading="loading"
      @toggle-lick-mew="fetchMew"
      @publish-mew="fetchMew"
      @delete-mew="run"
    />
  </QPage>
</template>

<script setup lang="ts">
import { QPage } from "quasar";
import CreateMewField from "@/components/CreateMewField.vue";
import BaseMewList from "@/components/BaseMewList.vue";
import { pageHeightCorrection } from "@/utils/page-layout";
import { ActionHash, AppAgentClient } from "@holochain/client";
import { ComputedRef, inject } from "vue";
import { FeedMew, MewTypeName } from "@/types/types";
import { useRequest } from "vue-request";
import { showError } from "@/utils/notification";
import isEqual from "lodash/isEqual";
import { watch } from "vue";

const client = (inject("client") as ComputedRef<AppAgentClient>).value;

const fetchMewsFeed = (): Promise<FeedMew[]> =>
  client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "get_my_followed_creators_mews_with_context",
    payload: null,
  });

const { data, loading, error, run } = useRequest(fetchMewsFeed, {
  initialData: [],
  pollingInterval: 120000, // 120 seconds polling
  refreshOnWindowFocus: true,
  refocusTimespan: 10000, // 10 seconds between window focus to trigger refresh
});
watch(error, showError);

const fetchMew = async (actionHash: ActionHash) => {
  if (data.value === undefined) return;

  const mew: FeedMew = await client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "get_mew_with_context",
    payload: actionHash,
  });

  const index = data.value.findIndex((mew: FeedMew) =>
    isEqual(actionHash, mew.action_hash)
  );

  if (index !== -1) {
    // Replace mew if already exists in data
    data.value[index] = mew;
  } else {
    // Insert mew at beginning of list if not
    data.value.unshift(mew);
  }
};
</script>
