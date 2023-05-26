<template>
  <QPage :style-fn="pageHeightCorrection">
    <InfiniteScrollMewList
      :fetch-fn="fetchMentionMews"
      :title="`Mews with ${route.meta.tag}${route.params.tag}`"
      :cache-key="`mews/get_mews_for_mention_with_context/${decodeHashFromBase64(route.params.agentPubKey as string)}`"
      :page="defaultPage"
    />
  </QPage>
</template>

<script setup lang="ts">
import { QPage } from "quasar";
import { pageHeightCorrection } from "@/utils/page-layout";
import { AppAgentClient, decodeHashFromBase64 } from "@holochain/client";
import { ComputedRef, inject, toRaw } from "vue";
import { useRoute } from "vue-router";
import InfiniteScrollMewList from "@/components/InfiniteScrollMewList.vue";
import { LoadMoreDataType } from "@/types/types";

const route = useRoute();
const client = (inject("client") as ComputedRef<AppAgentClient>).value;

const defaultPage = {
  limit: 10,
};

const fetchMentionMews = async (loadMoreData?: LoadMoreDataType) => {
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
    fn_name: "get_mews_for_mention_with_context",
    payload: {
      mention: decodeHashFromBase64(route.params.agentPubKey as string),
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
