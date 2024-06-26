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
        @mew-deleted="refetchRandomMewsWithTag()"
        @mew-licked="refetchRandomMewsWithTag()"
        @mew-unlicked="refetchRandomMewsWithTag()"
        @mew-pinned="refetchRandomMewsWithTag()"
        @mew-unpinned="refetchRandomMewsWithTag()"
        @mewmew-created="refetchRandomMewsWithTag()"
        @reply-created="refetchRandomMewsWithTag()"
        @quote-created="refetchRandomMewsWithTag()"
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
import { ComputedRef, Ref, computed, inject, watch } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { FeedMew } from "@/types/types";

const client = (inject("client") as ComputedRef<AppClient>).value;

const props = defineProps<{
  tag: string;
}>();

const tagRef = computed(() => props.tag);

const fetchRandomMewHashesWithTag = (): Promise<ActionHash[]> =>
  client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "get_random_mew_hashes_for_tag",
    payload: {
      tag: props.tag,
      count: 3,
    },
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
    payload: randomMewHashesWithTag.value,
  });

const {
  data: randomMewsWithTag,
  error: errorRandomMewsWithTag,
  isFetching: isFetchingRandomMewsWithTag,
  refetch: refetchRandomMewsWithTag,
} = useQuery({
  queryKey: [
    "mews",
    "get_random_mew_hashes_for_tag",
    tagRef,
    "get_batch_mews_with_context",
  ],
  queryFn: fetchMewsWithContext,
  enabled: hasRandomMewHashesWithTag,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
});
watch(errorRandomMewsWithTag, console.error);

watch(props, () => {
  refetchRandomMewHashesWithTag();
});

watch(randomMewHashesWithTag, () => {
  refetchRandomMewsWithTag();
});
</script>
