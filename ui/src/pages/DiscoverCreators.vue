<template>
  <div class="w-full mb-20">
    <h1 class="mb-8 flex justify-between items-end">
      <div class="text-2xl font-title font-bold tracking-tighter">explore</div>
      <button
        class="btn btn-xs flex items-center justify-start space-x-1"
        @click="shuffle()"
      >
        <IconDiceOutline />
        <div>Shuffle</div>
      </button>
    </h1>

    <BaseList
      v-slot="{ item }"
      title="random mews"
      class="mb-8"
      :items="randomMews"
      :is-loading="isLoadingRandomMewHashes || isLoadingRandomMews"
    >
      <BaseMewListItem
        :feed-mew="item"
        @mew-deleted="
          () => {
            console.log('mew-deleted');
            refetchRandomMews();
          }
        "
        @mew-licked="refetchRandomMews()"
        @mew-unlicked="refetchRandomMews()"
        @mew-pinned="refetchRandomMews()"
        @mew-unpinned="refetchRandomMews()"
        @mewmew-created="refetchRandomMews()"
        @reply-created="refetchRandomMews()"
        @quote-created="refetchRandomMews()"
      />
    </BaseList>

    <BaseList
      v-if="tag1Enabled"
      v-slot="{ item }"
      class="mb-8"
      :title="`mews about ${randomTags[0]}`"
      :items="randomMewsWithTag1"
      :is-loading="
        isLoadingRandomMewHashesWithTag1 || isLoadingRandomMewsWithTag1
      "
    >
      <BaseMewListItem
        :feed-mew="item"
        @mew-deleted="refetchRandomMewsWithTag1()"
        @mew-licked="refetchRandomMewsWithTag1()"
        @mew-unlicked="refetchRandomMewsWithTag1()"
        @mew-pinned="refetchRandomMewsWithTag1()"
        @mew-unpinned="refetchRandomMewsWithTag1()"
        @mewmew-created="refetchRandomMewsWithTag1()"
        @reply-created="refetchRandomMewsWithTag1()"
        @quote-created="refetchRandomMewsWithTag1()"
      />
    </BaseList>

    <BaseList
      v-if="tag2Enabled"
      v-slot="{ item }"
      class="mb-8"
      :title="`mews about ${randomTags[1]}`"
      :items="randomMewsWithTag2"
      :is-loading="
        isLoadingRandomMewHashesWithTag2 || isLoadingRandomMewsWithTag2
      "
    >
      <BaseMewListItem
        :feed-mew="item"
        @mew-deleted="refetchRandomMewsWithTag2()"
        @mew-licked="refetchRandomMewsWithTag2()"
        @mew-unlicked="refetchRandomMewsWithTag2()"
        @mew-pinned="refetchRandomMewsWithTag2()"
        @mew-unpinned="refetchRandomMewsWithTag2()"
        @mewmew-created="refetchRandomMewsWithTag2()"
        @reply-created="refetchRandomMewsWithTag2()"
        @quote-created="refetchRandomMewsWithTag2()"
      />
    </BaseList>

    <BaseList
      v-if="tag3Enabled"
      v-slot="{ item }"
      class="mb-8"
      :title="`mews about ${randomTags[2]}`"
      :items="randomMewsWithTag3"
      :is-loading="
        isLoadingRandomMewHashesWithTag3 || isLoadingRandomMewsWithTag3
      "
    >
      <BaseMewListItem
        :feed-mew="item"
        @mew-deleted="refetchRandomMewsWithTag3()"
        @mew-licked="refetchRandomMewsWithTag3()"
        @mew-unlicked="refetchRandomMewsWithTag3()"
        @mew-pinned="refetchRandomMewsWithTag3()"
        @mew-unpinned="refetchRandomMewsWithTag3()"
        @mewmew-created="refetchRandomMewsWithTag3()"
        @reply-created="refetchRandomMewsWithTag3()"
        @quote-created="refetchRandomMewsWithTag3()"
      />
    </BaseList>
  </div>
</template>

<script setup lang="ts">
import { ComputedRef, computed, inject, onMounted, toRaw, watch } from "vue";
import { AppAgentClient } from "@holochain/client";
import BaseList from "@/components/BaseList.vue";
import { FeedMew } from "@/types/types";
import { useQuery } from "@tanstack/vue-query";
import { showError } from "@/utils/toasts";
import IconDiceOutline from "~icons/ion/dice-outline";
import { ActionHash } from "@holochain/client";

const client = (inject("client") as ComputedRef<AppAgentClient>).value;

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
watch(errorRandomMewHashes, showError);

const hasRandomMewHashes = computed(
  () => randomMewHashes.value !== undefined && randomMewHashes.value.length > 0
);

const {
  data: randomMews,
  error: errorRandomMews,
  isLoading: isLoadingRandomMews,
  refetch: refetchRandomMews,
} = useQuery({
  queryKey: ["mews", "get_random_mew_hashes", "get_batch_mews_with_context"],
  enabled: hasRandomMewHashes,
  queryFn: () =>
    fetchMewsWithContext(toRaw(randomMewHashes.value as ActionHash[])),
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
});
watch(errorRandomMews, showError);

const fetchRandomTags = (): Promise<string[]> =>
  client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "get_random_tags",
    payload: 4,
  });

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
watch(errorRandomTags, showError);

onMounted(() => {
  if (randomTags.value == undefined || randomTags.value.length === 0) {
    refetchRandomTags();
  }
});

const fetchRandomMewHashesWithTag = (tag: string): Promise<ActionHash[]> =>
  client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "get_random_mew_hashes_for_tag",
    payload: {
      tag: tag,
      count: 3,
    },
  });

const tag1Enabled = computed<boolean>(
  () =>
    randomTags.value !== undefined &&
    randomTags.value.length > 0 &&
    randomTags.value[0] !== undefined
);
const tag2Enabled = computed<boolean>(
  () =>
    randomTags.value !== undefined &&
    randomTags.value.length > 1 &&
    randomTags.value[1] !== undefined
);
const tag3Enabled = computed<boolean>(
  () =>
    randomTags.value !== undefined &&
    randomTags.value.length > 2 &&
    randomTags.value[2] !== undefined
);

// Random Mews with Tag 1

const {
  data: randomMewHashesWithTag1,
  error: errorRandomMewHashesWithTag1,
  isLoading: isLoadingRandomMewHashesWithTag1,
  refetch: refetchRandomMewHashesWithTag1,
} = useQuery({
  queryKey: ["mews", "get_random_mew_hashes_for_tag", randomTags.value[0]],
  enabled: tag1Enabled,
  queryFn: () => fetchRandomMewHashesWithTag(randomTags.value[0]),
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
});
watch(errorRandomMewHashesWithTag1, showError);
const hasRandomMewHashesWithTag1 = computed(
  () =>
    tag1Enabled.value &&
    randomMewHashesWithTag1.value &&
    randomMewHashesWithTag1.value.length > 0
);

const {
  data: randomMewsWithTag1,
  error: errorRandomMewsWithTag1,
  isLoading: isLoadingRandomMewsWithTag1,
  refetch: refetchRandomMewsWithTag1,
} = useQuery({
  queryKey: [
    "mews",
    "get_random_mew_hashes_for_tag",
    randomTags.value[0],
    "get_batch_mews_with_context",
  ],

  queryFn: () =>
    fetchMewsWithContext(toRaw(randomMewHashesWithTag1.value as ActionHash[])),
  enabled: hasRandomMewHashesWithTag1,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
});
watch(errorRandomMewsWithTag1, showError);

// Random Mews with Tag 2

const {
  data: randomMewHashesWithTag2,
  error: errorRandomMewHashesWithTag2,
  isLoading: isLoadingRandomMewHashesWithTag2,
  refetch: refetchRandomMewHashesWithTag2,
} = useQuery({
  queryKey: ["mews", "get_random_mew_hashes_for_tag", randomTags.value[1]],
  enabled: tag2Enabled,
  queryFn: () => fetchRandomMewHashesWithTag(randomTags.value[1]),
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
});
watch(errorRandomMewHashesWithTag2, showError);
const hasRandomMewHashesWithTag2 = computed(
  () =>
    tag2Enabled.value &&
    randomMewHashesWithTag2.value &&
    randomMewHashesWithTag2.value.length > 0
);

const {
  data: randomMewsWithTag2,
  error: errorRandomMewsWithTag2,
  isLoading: isLoadingRandomMewsWithTag2,
  refetch: refetchRandomMewsWithTag2,
} = useQuery({
  queryKey: [
    "mews",
    "get_random_mew_hashes_for_tag",
    randomTags.value[1],
    "get_batch_mews_with_context",
  ],

  queryFn: () =>
    fetchMewsWithContext(toRaw(randomMewHashesWithTag2.value as ActionHash[])),
  enabled: hasRandomMewHashesWithTag2,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
});
watch(errorRandomMewsWithTag2, showError);

// Random Mews with Tag 3

const {
  data: randomMewHashesWithTag3,
  error: errorRandomMewHashesWithTag3,
  isLoading: isLoadingRandomMewHashesWithTag3,
  refetch: refetchRandomMewHashesWithTag3,
} = useQuery({
  queryKey: ["mews", "get_random_mew_hashes_for_tag", randomTags.value[2]],
  enabled: tag1Enabled,
  queryFn: () => fetchRandomMewHashesWithTag(randomTags.value[2]),
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
});
watch(errorRandomMewHashesWithTag3, showError);
const hasRandomMewHashesWithTag3 = computed(
  () =>
    tag3Enabled.value &&
    randomMewHashesWithTag3.value &&
    randomMewHashesWithTag3.value.length > 0
);

const {
  data: randomMewsWithTag3,
  error: errorRandomMewsWithTag3,
  isLoading: isLoadingRandomMewsWithTag3,
  refetch: refetchRandomMewsWithTag3,
} = useQuery({
  queryKey: [
    "mews",
    "get_random_mew_hashes_for_tag",
    randomTags.value[2],
    "get_batch_mews_with_context",
  ],

  queryFn: () =>
    fetchMewsWithContext(toRaw(randomMewHashesWithTag3.value as ActionHash[])),
  enabled: hasRandomMewHashesWithTag3,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
});
watch(errorRandomMewsWithTag3, showError);

const shuffle = async () => {
  await refetchRandomMewHashes();
  refetchRandomMews();
  await refetchRandomTags();

  if (tag1Enabled.value) {
    await refetchRandomMewHashesWithTag1();
    refetchRandomMewsWithTag1();
  }
  if (tag2Enabled.value) {
    await refetchRandomMewHashesWithTag2();
    refetchRandomMewsWithTag2();
  }
  if (tag3Enabled.value) {
    await refetchRandomMewHashesWithTag3();
    refetchRandomMewsWithTag3();
  }
};
</script>
