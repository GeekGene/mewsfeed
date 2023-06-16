<template>
  <QPage class="text-center" :style-fn="pageHeightCorrection">
    <div class="row justify-end">
      <QBtn @click="runFetchRandomTags">
        <QIcon name="svguse:/icons.svg#dice-multiple" class="q-mr-xs" />
        Shuffle
      </QBtn>
    </div>

    <div class="q-mb-xl">
      <BaseMewList
        title="Discover Mews"
        :feed-mews="randomMews"
        :is-loading="isLoadingRandomMews || isLoadingRandomTags"
      />
    </div>

    <div v-if="tag1Enabled" class="q-mb-xl">
      <BaseMewList
        :title="`Mews about ${randomTags[0]}`"
        :feed-mews="randomMewsWithTag1"
        :is-loading="isLoadingRandomMewsWithTag1"
      />
    </div>

    <div v-if="tag2Enabled" class="q-mb-xl">
      <BaseMewList
        :title="`Mews about ${randomTags[1]}`"
        :feed-mews="randomMewsWithTag2"
        :is-loading="isLoadingRandomMewsWithTag2"
      />
    </div>

    <div v-if="tag3Enabled" class="q-mb-xl">
      <BaseMewList
        :title="`Mews about ${randomTags[2]}`"
        :feed-mews="randomMewsWithTag3"
        :is-loading="isLoadingRandomMewsWithTag3"
      />
    </div>
  </QPage>
</template>

<script setup lang="ts">
import { QPage, QBtn, QIcon } from "quasar";
import { pageHeightCorrection } from "@/utils/page-layout";
import { ComputedRef, computed, inject, onMounted, watch } from "vue";
import { AppAgentClient } from "@holochain/client";
import BaseMewList from "@/components/BaseMewList.vue";
import { FeedMew } from "@/types/types";
import { useQuery } from "@tanstack/vue-query";
import { showError } from "@/utils/toasts";

const client = (inject("client") as ComputedRef<AppAgentClient>).value;

const fetchMews = (): Promise<FeedMew[]> =>
  client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "get_random_mews_with_context",
    payload: 3,
  });

const {
  data: randomMews,
  error: errorRandomMews,
  isLoading: isLoadingRandomMews,
  refetch: refetchRandomMews,
} = useQuery({
  queryKey: ["mews", "get_random_mews_with_context"],
  queryFn: fetchMews,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
});

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
  isLoading: isLoadingRandomTags,
  refetch: refetchRandomTags,
} = useQuery({
  queryKey: ["mews", "get_random_tags"],
  queryFn: fetchRandomTags,
  initialData: [],
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
});

onMounted(() => {
  if (randomTags.value == undefined || randomTags.value.length === 0) {
    refetchRandomTags();
  }
});

const fetchRandomMewsWithTag = (tag: string) =>
  client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "get_random_mews_for_tag_with_context",
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

const {
  data: randomMewsWithTag1,
  error: errorRandomMewsWithTag1,
  isLoading: isLoadingRandomMewsWithTag1,
  refetch: refetchRandomMewsWithTag1,
} = useQuery({
  queryKey: [
    "mews",
    "get_random_mews_for_tag_with_context",
    randomTags.value[0],
  ],
  queryFn: () => fetchRandomMewsWithTag(randomTags.value[0]),
  enabled: tag1Enabled,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
});

const {
  data: randomMewsWithTag2,
  error: errorRandomMewsWithTag2,
  isLoading: isLoadingRandomMewsWithTag2,
  refetch: refetchRandomMewsWithTag2,
} = useQuery({
  queryKey: [
    "mews",
    "get_random_mews_for_tag_with_context",
    randomTags.value[1],
  ],
  queryFn: () => fetchRandomMewsWithTag(randomTags.value[1]),
  enabled: tag2Enabled,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
});

const {
  data: randomMewsWithTag3,
  error: errorRandomMewsWithTag3,
  isLoading: isLoadingRandomMewsWithTag3,
  refetch: refetchRandomMewsWithTag3,
} = useQuery({
  queryKey: [
    "mews",
    "get_random_mews_for_tag_with_context",
    randomTags.value[2],
  ],
  queryFn: () => fetchRandomMewsWithTag(randomTags.value[2]),
  enabled: tag3Enabled,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
});

watch(
  [
    errorRandomMews,
    errorRandomTags,
    errorRandomMewsWithTag1,
    errorRandomMewsWithTag2,
    errorRandomMewsWithTag3,
  ],
  showError
);

const runFetchRandomTags = async () => {
  refetchRandomMews();
  await refetchRandomTags();

  if (tag1Enabled.value) {
    refetchRandomMewsWithTag1();
  }
  if (tag2Enabled.value) {
    refetchRandomMewsWithTag2();
  }
  if (tag3Enabled.value) {
    refetchRandomMewsWithTag3();
  }
};
</script>
