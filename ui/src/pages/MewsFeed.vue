<template>
  <QPage class="q-pb-lg" :style-fn="pageHeightCorrection">
    <CreateMewField
      :mew-type="{ [MewTypeName.Original]: null }"
      @publish-mew="run"
    />

    <h6 class="q-mb-md">Your Mews Feed</h6>

    <MewList
      :mews="data || []"
      :is-loading="loading"
      @toggle-lick-mew="reloadMew"
      @publish-mew="run"
      @delete-mew="run"
    />
  </QPage>
</template>

<script setup lang="ts">
import { QPage } from "quasar";
import CreateMewField from "@/components/CreateMewField.vue";
import MewList from "@/components/MewList.vue";
import { pageHeightCorrection } from "@/utils/page-layout";
import { ActionHash, AppAgentClient } from "@holochain/client";
import { ComputedRef, inject } from "vue";
import { FeedMew, MewTypeName } from "@/types/types";
import { useRequest } from "vue-request";
import isEqual from "lodash.isequal";

const client = (inject("client") as ComputedRef<AppAgentClient>).value;

const fetchMewsFeed = (): Promise<FeedMew[]> =>
  client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "get_my_followed_creators_mews_with_context",
    payload: null,
  });

const reloadMew = async (actionHash: ActionHash) => {
  if (!data.value || data.value.length === 0) return;

  const index = data.value.findIndex((mew: FeedMew) =>
    isEqual(actionHash, mew.action_hash)
  );
  if (index !== -1) {
    data.value[index] = await client.callZome({
      role_name: "mewsfeed",
      zome_name: "mews",
      fn_name: "get_mew_with_context",
      payload: actionHash,
    });
  }
};

const { data, loading, run } = useRequest(fetchMewsFeed, {
  pollingInterval: 120000, // 120 seconds polling
  refreshOnWindowFocus: true,

  // 10 seconds between window focus to trigger refresh
  refocusTimespan: 10000,
});
</script>
