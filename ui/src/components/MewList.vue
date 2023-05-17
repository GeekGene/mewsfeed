<template>
  <CreateMewField
    v-if="showCreateMewField"
    :mew-type="{ [MewTypeName.Original]: null }"
    @mew-created="onCreateMew"
  />

  <BaseMewList
    v-bind="$attrs"
    :feed-mews="data"
    :is-loading="loading"
    @mew-deleted="updateFeedMew"
    @mew-licked="updateFeedMew"
    @mew-unlicked="updateFeedMew"
    @mew-pinned="
      (val) => {
        updateFeedMew(val);
        emit('mew-pinned', val);
      }
    "
    @mew-unpinned="
      (val) => {
        updateFeedMew(val);
        emit('mew-unpinned', val);
      }
    "
    @reply-created="insertResponseAndUpdateOriginal"
    @mewmew-created="insertResponseAndUpdateOriginal"
    @quote-created="insertResponseAndUpdateOriginal"
  />
</template>

<script setup lang="ts">
import { FeedMew, MewTypeName } from "@/types/types";
import { showError, showMessage } from "@/utils/notification";
import { watch } from "vue";
import isEqual from "lodash/isEqual";
import mergeWith from "lodash/mergeWith";
import isArray from "lodash/isArray";
import { useRequest } from "vue-request";
import BaseMewList from "@/components/BaseMewList.vue";
import CreateMewField from "@/components/CreateMewField.vue";
import { ActionHash } from "@holochain/client";

const props = withDefaults(
  defineProps<{
    fetchFn: () => Promise<FeedMew[]>;
    cacheKey: string;
    showCreateMewField?: boolean;
    pollingInterval?: number;
    refreshOnWindowFocus?: boolean;
    insertResponses?: boolean;
  }>(),
  {
    showCreateMewField: false,
    pollingInterval: 120000,
    refreshOnWindowFocus: true,
    insertResponses: false,
  }
);
const emit = defineEmits(["mew-pinned", "mew-unpinned"]);

const { data, loading, error, mutate } = useRequest(props.fetchFn, {
  cacheKey: props.cacheKey,
  pollingInterval: props.pollingInterval, // 120 seconds polling
  refreshOnWindowFocus: true,
  refocusTimespan: 10000, // 10 seconds between window focus to trigger refresh
  loadingDelay: 1000,
});
watch(error, showError);

const onCreateMew = async (feedMew: FeedMew) => {
  insertFeedMew(feedMew);
  showMessage("Published Mew");
};

const updateFeedMew = async (feedMew: FeedMew) => {
  if (data.value === undefined) return;

  const index = data.value.findIndex((f: FeedMew) =>
    isEqual(f.action_hash, feedMew.action_hash)
  );

  if (index !== -1) {
    // Replace mew if already exists in data
    const newData = data.value;
    newData[index] = feedMew;
    mutate(newData);
  }
};

const insertFeedMew = async (feedMew: FeedMew) => {
  if (data.value === undefined) return;

  const index = data.value.findIndex((f: FeedMew) =>
    isEqual(f.action_hash, feedMew.action_hash)
  );

  if (index === -1) {
    // Insert mew at beginning of list if not
    const newData = data.value;
    newData.unshift(feedMew);
    mutate(newData);
  }
};

const updateOriginal = async (response: FeedMew) => {
  if (data.value === undefined) return;
  if (MewTypeName.Original in response.mew.mew_type) return;

  let originalActionHash: ActionHash | undefined;
  let mergeNewData = {};
  if (MewTypeName.Reply in response.mew.mew_type) {
    originalActionHash = response.mew.mew_type[MewTypeName.Reply];
    mergeNewData = { replies: [response.action_hash] };
  } else if (MewTypeName.Mewmew in response.mew.mew_type) {
    originalActionHash = response.mew.mew_type[MewTypeName.Mewmew];
    mergeNewData = { mewmews: [response.action_hash] };
  } else if (MewTypeName.Quote in response.mew.mew_type) {
    originalActionHash = response.mew.mew_type[MewTypeName.Quote];
    mergeNewData = { quotes: [response.action_hash] };
  }

  const index = data.value.findIndex((f: FeedMew) =>
    isEqual(f.action_hash, originalActionHash)
  );

  const newData = data.value;
  if (index !== -1) {
    mergeWith(newData[index], mergeNewData, (obj, src) => {
      if (isArray(obj)) {
        return obj.concat(src);
      }
    });

    mutate(newData);
  }
};

const insertResponseAndUpdateOriginal = async (response: FeedMew) => {
  updateOriginal(response);

  if (props.insertResponses) {
    insertFeedMew(response);
  }
};
</script>
