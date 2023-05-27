<template>
  <QPage :style-fn="pageHeightCorrection">
    <InfiniteScrollMewList
      :fetch-fn="fetchHashtagMews"
      :title="`Mews with ${route.meta.tag}${route.params.tag}`"
      :cache-key="`mews/get_mews_for_hashtag_with_context/${route.meta.tag}${route.params.tag}`"
    />
  </QPage>
</template>

<script setup lang="ts">
import { QPage } from "quasar";
import { pageHeightCorrection } from "@/utils/page-layout";
import { AppAgentClient } from "@holochain/client";
import { ComputedRef, inject, toRaw } from "vue";
import { useRoute } from "vue-router";
import { LoadMoreDataType } from "@/types/types";
import InfiniteScrollMewList from "@/components/InfiniteScrollMewList.vue";

const route = useRoute();
const client = (inject("client") as ComputedRef<AppAgentClient>).value;

const defaultPage = {
  limit: 10,
};

const fetchHashtagMews = async (loadMoreData?: LoadMoreDataType) => {
  if (!loadMoreData) {
    loadMoreData = {
      list: [],
      key: JSON.stringify(defaultPage),
      nextPage: defaultPage,
      noMore: false,
    };
  }

  const res = await client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "get_mews_for_hashtag_with_context",
    payload: {
      hashtag: `${route.meta.tag}${route.params.tag}`,
      page: toRaw(loadMoreData).nextPage,
    },
  });

  const noMore = res.length === 0;
  const nextPage = {
    limit: loadMoreData.nextPage.limit,
    after_hash: res.length > 0 ? res[res.length - 1].action_hash : null,
  };

  return {
    list: res,
    key: JSON.stringify(loadMoreData.page),
    nextPage: nextPage,
    noMore,
  };
};
</script>
