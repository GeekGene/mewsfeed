<template>
  <div class="w-full">
    <div class="mb-8 flex justify-between items-center">
      <h1 class="text-2xl font-title font-bold tracking-tighter">explore</h1>

      <button
        class="btn btn-xs flex items-center justify-start space-x-1"
        @click="shuffle()"
      >
        <IconDiceOutline />
        <div>Shuffle</div>
      </button>
    </div>

    <BaseList
      title="random mews"
      class="mb-8"
      :items="randomMews"
      :is-loading="isLoadingRandomMewHashes || isFetchingRandomMews"
    >
      <template #default="{ item }">
        <BaseMewListItem
          :feed-mew="item"
          @mew-deleted="refetchRandomMews()"
          @mew-licked="refetchRandomMews()"
          @mew-unlicked="refetchRandomMews()"
          @mew-pinned="refetchRandomMews()"
          @mew-unpinned="refetchRandomMews()"
          @mewmew-created="refetchRandomMews()"
          @reply-created="refetchRandomMews()"
          @quote-created="refetchRandomMews()"
        />
      </template>
      <template #loading>
        <BaseListSkeleton :count="4">
          <BaseMewListItemSkeleton />
        </BaseListSkeleton>
      </template>
    </BaseList>

    <RandomMewWithTagList v-if="tag1 !== undefined" :tag="tag1" />
    <RandomMewWithTagList v-if="tag2 !== undefined" :tag="tag2" />
    <RandomMewWithTagList v-if="tag3 !== undefined" :tag="tag3" />
  </div>
</template>

<script setup lang="ts">
import { ComputedRef, computed, inject, onMounted, toRaw, watch } from "vue";
import { AppClient } from "@holochain/client";
import BaseList from "@/components/BaseList.vue";
import { FeedMew } from "@/types/types";
import { useQuery } from "@tanstack/vue-query";
import IconDiceOutline from "~icons/ion/dice-outline";
import { ActionHash } from "@holochain/client";
import BaseListSkeleton from "@/components/BaseListSkeleton.vue";
import BaseMewListItemSkeleton from "@/components/BaseMewListItemSkeleton.vue";

const client = (inject("client") as ComputedRef<AppClient>).value;

const fetchRandomMewHashes = (): Promise<ActionHash[]> =>
  client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "get_random_mew_hashes",
    payload: 3,
  });

const fetchMewsWithContext = async (hashes: ActionHash[]): Promise<FeedMew[]> =>
  client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "get_batch_mews_with_context",
    payload: hashes,
  });

const {
  data: randomMewHashes,
  error: errorRandomMewHashes,
  isLoading: isLoadingRandomMewHashes,
  refetch: refetchRandomMewHashes,
} = useQuery({
  queryKey: ["mews", "get_random_mew_hashes"],
  queryFn: () => fetchRandomMewHashes(),
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
});
watch(errorRandomMewHashes, console.error);

const hasRandomMewHashes = computed(
  () => randomMewHashes.value !== undefined && randomMewHashes.value.length > 0
);

const {
  data: randomMews,
  error: errorRandomMews,
  refetch: refetchRandomMews,
  isFetching: isFetchingRandomMews,
} = useQuery({
  queryKey: ["mews", "get_random_mew_hashes", "get_batch_mews_with_context"],
  enabled: hasRandomMewHashes,
  queryFn: () =>
    fetchMewsWithContext(toRaw(randomMewHashes.value as ActionHash[])),
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
});
watch(errorRandomMews, console.error);

const fetchRandomTags = (): Promise<string[]> => {
  return client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "get_random_tags",
    payload: 4,
  });
};

const {
  data: randomTags,
  error: errorRandomTags,
  refetch: refetchRandomTags,
} = useQuery({
  queryKey: ["mews", "get_random_tags"],
  queryFn: fetchRandomTags,
  initialData: [],
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
});
watch(errorRandomTags, console.error);

onMounted(async () => {
  if (randomMews.value === undefined || randomMews.value.length === 0) {
    await refetchMews();
  }
  if (randomTags.value === undefined || randomTags.value.length === 0) {
    refetchRandomTags();
  }
});

const tag1 = computed(() =>
  randomTags.value ? randomTags.value[0] : undefined
);
const tag2 = computed(() =>
  randomTags.value ? randomTags.value[1] : undefined
);
const tag3 = computed(() =>
  randomTags.value ? randomTags.value[2] : undefined
);

const shuffle = async () => {
  await refetchMews();
  await refetchRandomTags();
};

const refetchMews = async () => {
  await refetchRandomMewHashes();
  refetchRandomMews();
};
</script>
