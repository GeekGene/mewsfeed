<template>
  <CreateMewField
    v-if="showCreateMewField"
    :mew-type="{ [MewTypeName.Original]: null }"
    @publish-mew="fetchMew"
  />

  <BaseMewList
    v-bind="$attrs"
    :feed-mews="data"
    :is-loading="loading"
    @delete-mew="run"
    @publish-mew="run"
    @toggle-lick-mew="fetchMew"
  />
</template>

<script setup lang="ts">
import { FeedMew, MewTypeName } from "@/types/types";
import { showError } from "@/utils/notification";
import { ComputedRef, inject, watch, onMounted } from "vue";
import { ActionHash, AppAgentClient } from "@holochain/client";
import { isEqual } from "lodash";
import { useRequest } from "vue-request";
import BaseMewList from "@/components/BaseMewList.vue";
import CreateMewField from "@/components/CreateMewField.vue";

const client = (inject("client") as ComputedRef<AppAgentClient>).value;

const props = withDefaults(
  defineProps<{
    fetchFn: () => Promise<FeedMew[]>;
    cacheKey: string;
    showCreateMewField?: boolean;
  }>(),
  {
    showCreateMewField: false,
  }
);

const { data, loading, error, run, mutate } = useRequest(props.fetchFn, {
  cacheKey: props.cacheKey,
  initialData: [],
  pollingInterval: 120000, // 120 seconds polling
  refreshOnWindowFocus: true,
  refocusTimespan: 10000, // 10 seconds between window focus to trigger refresh
  loadingDelay: 1000,
});
watch(error, showError);

const fetchMew = async (actionHash: ActionHash) => {
  console.log("fetchMew");

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

  const newData = data.value;
  if (index !== -1) {
    // Replace mew if already exists in data
    newData[index] = mew;
  } else {
    // Insert mew at beginning of list if not
    newData.unshift(mew);
  }
  mutate(newData);
};


onMounted(() => {
  console.log("mounted mewList", props.cacheKey);
});
</script>
