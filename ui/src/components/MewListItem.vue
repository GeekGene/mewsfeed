<template>
  <MewListItemSkeleton v-if="loading || !mew" />
  <BaseMewListItem
    v-else
    :feed-mew="mew"
    @publish-mew="updateFeedMew"
    @toggle-lick-mew="updateFeedMew"
    @delete-mew="updateFeedMew"
  ></BaseMewListItem>
</template>

<script setup lang="ts">
import { showError } from "@/utils/notification";
import { ActionHash, AppAgentClient } from "@holochain/client";
import { inject, ComputedRef, watch } from "vue";
import BaseMewListItem from "@/components/BaseMewListItem.vue";
import MewListItemSkeleton from "@/components/MewListItemSkeleton.vue";
import { useRequest } from "vue-request";
import { FeedMew } from "@/types/types";

const client = (inject("client") as ComputedRef<AppAgentClient>).value;

const props = defineProps<{
  actionHash: ActionHash;
  modelValue?: FeedMew;
}>();

const emit = defineEmits(["update:modelValue"]);

const fetchMew = () =>
  client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "get_mew_with_context",
    payload: props.actionHash,
  });

const {
  data: mew,
  loading,
  error,
  run: runFetchMew,
  mutate,
} = useRequest(fetchMew, {
  cacheKey: `mews/get_mew_with_context/${props.actionHash}`,
  pollingInterval: 120000, // 120 seconds polling
  refreshOnWindowFocus: true,
  refocusTimespan: 10000, // 10 seconds between window focus to trigger refresh
  loadingDelay: 400,
});
watch(error, showError);
watch(mew, (newMew) => {
  emit("update:modelValue", newMew);
});


const updateFeedMew = async (feedMew: FeedMew) => {
  mutate(feedMew);
};
</script>
