<template>
  <div class="w-full">
    <div class="flex justify-start items-center space-x-2 mb-8">
      <BaseButtonBack />

      <h1 class="text-2xl font-title font-bold tracking-tighter">
        mews with
        <span class="text-primary"
          >{{ route.meta.tag }}{{ route.params.tag }}</span
        >
      </h1>
    </div>

    <QInfiniteScroll
      v-if="
        data && data.pages && data.pages.length > 0 && data.pages[0].length > 0
      "
      :offset="250"
      @load="fetchNextPageInfiniteScroll"
    >
      <template v-for="(page, i) in data.pages" :key="i">
        <template v-for="(mew, j) of page" :key="j">
          <BaseMewListItem
            :feed-mew="mew"
            @mew-deleted="
              refetch({ refetchPage: (page, index) => index === i })
            "
            @mew-licked="refetch({ refetchPage: (page, index) => index === i })"
            @mew-pinned="refetch({ refetchPage: (page, index) => index === i })"
            @mew-unlicked="
              refetch({ refetchPage: (page, index) => index === i })
            "
            @mew-unpinned="
              refetch({ refetchPage: (page, index) => index === i })
            "
            @mewmew-created="
              refetch({ refetchPage: (page, index) => index === i })
            "
            @quote-created="
              refetch({ refetchPage: (page, index) => index === i })
            "
            @reply-created="
              refetch({ refetchPage: (page, index) => index === i })
            "
          />
        </template>
      </template>

      <template #loading>
        <div class="loading loading-dots loading-sm"></div>
      </template>
      <div v-if="!hasNextPage" class="flex justify-center mt-8 text-base-300">
        <IconPaw />
      </div>
    </QInfiniteScroll>
    <BaseMewListSkeleton v-else-if="isLoading" />
    <BaseEmptyList v-else />
  </div>
</template>

<script setup lang="ts">
import { QInfiniteScroll } from "quasar";
import { AppAgentClient, decodeHashFromBase64 } from "@holochain/client";
import { ComputedRef, inject } from "vue";
import { useRoute, onBeforeRouteLeave } from "vue-router";
import { useInfiniteQuery, useQueryClient } from "@tanstack/vue-query";
import BaseMewListSkeleton from "@/components/BaseMewListSkeleton.vue";
import BaseEmptyList from "@/components/BaseEmptyList.vue";
import BaseMewListItem from "@/components/BaseMewListItem.vue";
import { watch } from "vue";
import { showError } from "@/utils/toasts";
import BaseButtonBack from "@/components/BaseButtonBack.vue";

const route = useRoute();
const client = (inject("client") as ComputedRef<AppAgentClient>).value;
const queryClient = useQueryClient();

const pageLimit = 10;

const fetchMentionMews = async (params: any) => {
  const res = await client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "get_mews_for_mention_with_context",
    payload: {
      mention: decodeHashFromBase64(route.params.agentPubKey as string),
      page: {
        limit: pageLimit,
        ...params.pageParam,
      },
    },
  });
  return res;
};

const { data, error, fetchNextPage, hasNextPage, isLoading, refetch } =
  useInfiniteQuery({
    queryKey: [
      "mews",
      "get_mews_for_mention_with_context",
      `${route.meta.tag}${route.params.tag}`,
    ],
    queryFn: fetchMentionMews,
    getNextPageParam: (lastPage) => {
      if (lastPage.length === 0) return;
      if (lastPage.length < pageLimit) return;

      return { after_hash: lastPage[lastPage.length - 1].action_hash };
    },
    refetchInterval: 1000 * 60 * 2, // 2 minutes
  });
watch(error, showError);

const fetchNextPageInfiniteScroll = async (
  index: number,
  done: (stop?: boolean) => void
) => {
  await fetchNextPage();
  done(!hasNextPage?.value);
};

onBeforeRouteLeave(() => {
  if (data.value && data.value.pages.length > 1) {
    queryClient.setQueryData(
      [
        "mews",
        "get_mews_for_mention_with_context",
        `${route.meta.tag}${route.params.tag}`,
      ],
      (d: any) => ({
        pages: [d.pages[0]],
        pageParams: [d.pageParams[0]],
      })
    );
  }
});
</script>
