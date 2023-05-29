<template>
  <BaseMewListItemSkeleton v-if="loading || !mew" />
  <BaseMewListItem
    v-else
    :feed-mew="mew"
    @reply-created="updateFeedMew"
    @mewmew-created="updateFeedMew"
    @quote-created="updateFeedMew"
    @mew-licked="updateFeedMew"
    @mew-unlicked="updateFeedMew"
    @mew-pinned="updateFeedMew"
    @mew-unpinned="updateFeedMew"
    @mew-deleted="updateFeedMew"
  ></BaseMewListItem>
</template>

<script setup lang="ts">
import { showError } from "@/utils/toasts";
import { ActionHash, AppAgentClient } from "@holochain/client";
import { inject, ComputedRef, watch } from "vue";
import BaseMewListItem from "@/components/BaseMewListItem.vue";
import BaseMewListItemSkeleton from "@/components/BaseMewListItemSkeleton.vue";
import { useRequest } from "vue-request";
import { FeedMew } from "@/types/types";
import { localStorageCacheSettings } from "@/utils/requests";
import { encodeHashToBase64 } from "@holochain/client";

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
  mutate,
} = useRequest(fetchMew, {
  cacheKey: `mews/get_mew_with_context/${encodeHashToBase64(props.actionHash)}`,
  loadingDelay: 1000,
  ...localStorageCacheSettings,
});
watch(error, showError);
watch(mew, (newMew) => {
  emit("update:modelValue", newMew);
});

const updateFeedMew = async (feedMew: FeedMew) => {
  mutate(feedMew);
};
</script>
