<template>
  <QPage class="text-center" :style-fn="pageHeightCorrection">
    <div class="row justify-end">
      <QBtn
        @click="
          () => {
            runFetchRandomTags();
            forceReloadMewsListsKey += 1;
          }
        "
      >
        <QIcon name="svguse:/icons.svg#dice-multiple" class="q-mr-xs" />
        Shuffle
      </QBtn>
    </div>

    <div class="q-mb-xl">
      <MewList
        :key="`random-mews-${forceReloadMewsListsKey}`"
        :fetch-fn="fetchMews"
        title="Discover Mews"
        cache-key="mews/get_random_mews_with_context"
        :request-options="{
          pollingInterval: undefined,
          refocusTimespan: undefined,
          refreshOnWindowFocus: false,
          loadingDelay: 1000,
        }"
      />
    </div>

    <div
      v-for="tag in tags"
      :key="`random-tagged-mews-container-${tag}-${forceReloadMewsListsKey}`"
      class="q-mb-xl"
    >
      <MewList
        :key="tag"
        :fetch-fn="fetchMewsWithRandomTag(tag)"
        :title="
          tags && tags.length > 0 ? `Mews about ${tag}` : 'Discover Topics'
        "
        :cache-key="`mews/get_random_mews_for_tag_with_context/${tag}`"
        :request-options="{
          pollingInterval: undefined,
          refocusTimespan: undefined,
          refreshOnWindowFocus: false,
          loadingDelay: 1000,
        }"
      />
    </div>
  </QPage>
</template>

<script setup lang="ts">
import { QPage, QBtn, QIcon } from "quasar";
import { pageHeightCorrection } from "@/utils/page-layout";
import { ComputedRef, inject, ref } from "vue";
import { AppAgentClient } from "@holochain/client";
import MewList from "@/components/MewList.vue";
import { FeedMew } from "@/types/types";
import { useRequest } from "vue-request";
import { localStorageCacheSettings } from "@/utils/requests";

const client = (inject("client") as ComputedRef<AppAgentClient>).value;
const forceReloadMewsListsKey = ref(0);

const fetchMews = (): Promise<FeedMew[]> =>
  client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "get_random_mews_with_context",
    payload: 3,
  });

const fetchRandomTags = (): Promise<string[]> =>
  client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "get_random_tags",
    payload: 4,
  });

const { data: tags, run: runFetchRandomTags } = useRequest(fetchRandomTags, {
  cacheKey: `get_random_tags`,
  ...localStorageCacheSettings,
});

const fetchMewsWithRandomTag = (tag: string) => {
  return (): Promise<FeedMew[]> =>
    client.callZome({
      role_name: "mewsfeed",
      zome_name: "mews",
      fn_name: "get_random_mews_for_tag_with_context",
      payload: {
        tag: tag,
        count: 3,
      },
    });
};
</script>
