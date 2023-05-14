<template>
  <CreateMewField
    v-if="showCreateMewField"
    :mew-type="{ [MewTypeName.Original]: null }"
    @publish-mew="onCreateMew"
  />

  <BaseMewList
    v-bind="$attrs"
    :feed-mews="data"
    :is-loading="loading"
    @delete-mew="upsertFeedMew"
    @toggle-lick-mew="upsertFeedMew"
    @publish-mew="upsertFeedMewAndUpdateOriginal"
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
import { localStorageCacheConfig } from "@/utils/request";

const props = withDefaults(
  defineProps<{
    fetchFn: () => Promise<FeedMew[]>;
    cacheKey: string;
    showCreateMewField?: boolean;
    enableUpsertOnResponse?: boolean;
  }>(),
  {
    showCreateMewField: false,
    enableUpsertOnResponse: true,
  }
);

const { data, loading, error, mutate } = useRequest(props.fetchFn, {
  cacheKey: props.cacheKey,
  pollingInterval: 120000, // 120 seconds polling
  refreshOnWindowFocus: true,
  refocusTimespan: 10000, // 10 seconds between window focus to trigger refresh
  loadingDelay: 1000,
  ...localStorageCacheConfig,
});
watch(error, showError);

const onCreateMew = async (feedMew: FeedMew) => {
  upsertFeedMew(feedMew);
  showMessage("Published Mew");
};

const upsertFeedMew = async (feedMew: FeedMew) => {
  if (data.value === undefined) return;

  const index = data.value.findIndex((f: FeedMew) =>
    isEqual(f.action_hash, feedMew.action_hash)
  );

  const newData = data.value;
  if (index !== -1) {
    // Replace mew if already exists in data
    newData[index] = feedMew;
  } else {
    // Insert mew at beginning of list if not
    newData.unshift(feedMew);
  }
  mutate(newData);
};

const updateOriginal = async (feedMew: FeedMew) => {
  if (data.value === undefined) return;
  if (MewTypeName.Original in feedMew.mew.mew_type) return;

  let originalActionHash: ActionHash | undefined;
  let mergeNewData = {};
  if (MewTypeName.Reply in feedMew.mew.mew_type) {
    originalActionHash = feedMew.mew.mew_type[MewTypeName.Reply];
    mergeNewData = { replies: [feedMew.action_hash] };
  } else if (MewTypeName.Mewmew in feedMew.mew.mew_type) {
    originalActionHash = feedMew.mew.mew_type[MewTypeName.Mewmew];
    mergeNewData = { mewmews: [feedMew.action_hash] };
  } else if (MewTypeName.Quote in feedMew.mew.mew_type) {
    originalActionHash = feedMew.mew.mew_type[MewTypeName.Quote];
    mergeNewData = { quotes: [feedMew.action_hash] };
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

const upsertFeedMewAndUpdateOriginal = async (feedMew: FeedMew) => {
  updateOriginal(feedMew);

  if (props.enableUpsertOnResponse) {
    upsertFeedMew(feedMew);
  }
};
</script>
