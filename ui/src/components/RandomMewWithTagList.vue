<template>
  <BaseList
    class="mb-8"
    :title="`mews about ${tag}`"
    :items="randomMewsWithTag"
    :is-loading="isLoadingRandomMewHashesWithTag || isFetchingRandomMewsWithTag"
  >
    <template #default="{ item }">
      <BaseMewListItem
        :feed-mew="item"
        @mew-deleted="patchMew"
        @mew-licked="patchMew"
        @mew-unlicked="patchMew"
        @mew-pinned="patchMew"
        @mew-unpinned="patchMew"
        @mewmew-created="patchMew"
        @reply-created="patchMew"
        @quote-created="patchMew"
      />
    </template>
    <template #loading>
      <BaseListSkeleton :count="4">
        <BaseMewListItemSkeleton />
      </BaseListSkeleton>
    </template>
  </BaseList>
</template>

<script setup lang="ts">
import { AppClient, ActionHash } from "@holochain/client";
import { ComputedRef, Ref, computed, inject, toRaw, watch } from "vue";
import { useCellsReady } from "@/composables/useCellsReady";
import { useQuery } from "@tanstack/vue-query";
import { usePatchFeedMew } from "@/composables/usePatchFeedMew";
import { FeedMew } from "@/types/types";
import { wrapInput } from "@/utils/zomeCall";

const client = (inject("client") as ComputedRef<AppClient>).value;
const cellsReady = useCellsReady();
const { patchFeedMew } = usePatchFeedMew();

const props = defineProps<{
  tag: string;
}>();

const tagRef = computed(() => props.tag);

const fetchRandomMewHashesWithTag = (): Promise<ActionHash[]> =>
  client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "get_random_mew_hashes_for_tag",
    payload: wrapInput({
      tag: props.tag,
      count: 3,
    }),
  });

const {
  data: randomMewHashesWithTag,
  error: errorRandomMewHashesWithTag,
  isLoading: isLoadingRandomMewHashesWithTag,
  refetch: refetchRandomMewHashesWithTag,
} = useQuery({
  queryKey: ["mews", "get_random_mew_hashes_for_tag", tagRef],
  queryFn: fetchRandomMewHashesWithTag,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
  enabled: cellsReady,
});
watch(errorRandomMewHashesWithTag, console.error);
const hasRandomMewHashesWithTag = computed(() =>
  randomMewHashesWithTag.value
    ? (randomMewHashesWithTag as Ref<ActionHash[]>).value.length > 0
    : false
);

const fetchMewsWithContext = async (): Promise<FeedMew[]> =>
  client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "get_batch_mews_with_context",
    payload: wrapInput(toRaw(randomMewHashesWithTag.value)),
  });

const randomMewsWithTagQueryKey = [
  "mews",
  "get_random_mew_hashes_for_tag",
  tagRef,
  "get_batch_mews_with_context",
];

const patchMew = (updatedMew: FeedMew) => {
  patchFeedMew(randomMewsWithTagQueryKey, updatedMew);
};

const {
  data: randomMewsWithTag,
  error: errorRandomMewsWithTag,
  isFetching: isFetchingRandomMewsWithTag,
  refetch: refetchRandomMewsWithTag,
} = useQuery({
  queryKey: randomMewsWithTagQueryKey,
  queryFn: fetchMewsWithContext,
  enabled: computed(() => cellsReady.value && hasRandomMewHashesWithTag.value),
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
});
watch(errorRandomMewsWithTag, console.error);

watch(props, () => {
  refetchRandomMewHashesWithTag();
});

watch(randomMewHashesWithTag, () => {
  if (hasRandomMewHashesWithTag.value) {
    refetchRandomMewsWithTag();
  }
});
</script>
