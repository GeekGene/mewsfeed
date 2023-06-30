<template>
  <div class="w-full">
    <h1 class="text-2xl font-title font-bold tracking-tighter mb-8">
      mewsfeed
    </h1>

    <QInfiniteScroll
      v-if="
        data && data.pages && data.pages.length > 0 && data.pages[0].length > 0
      "
      :offset="250"
      @load="fetchNextPageInfiniteScroll"
    >
      <div>
        <template v-for="(page, i) in data.pages" :key="i">
          <template v-for="(mew, j) of page" :key="j">
            <BaseMewListItem
              :feed-mew="mew"
              @mew-deleted="
                refetch({ refetchPage: (page, index) => index === i })
              "
              @mew-licked="
                refetch({ refetchPage: (page, index) => index === i })
              "
              @mew-pinned="
                refetch({ refetchPage: (page, index) => index === i })
              "
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
            <hr v-if="j !== page.length - 1" />
          </template>
        </template>
      </div>

      <template #loading>
        <div class="w-full flex justify-center mt-8">
          <div class="loading loading-dots loading-md"></div>
        </div>
      </template>
      <div
        v-if="!hasNextPage"
        class="flex justify-center mb-8 text-base-300 text-2xl"
      >
        <IconPaw />
      </div>
    </QInfiniteScroll>
    <BaseMewListSkeleton v-else-if="isLoading" />
    <BaseEmptyList v-else />
  </div>
</template>

<script setup lang="ts">
import { QInfiniteScroll } from "quasar";
import { AppAgentClient, encodeHashToBase64 } from "@holochain/client";
import { ComputedRef, inject, watch } from "vue";
import { FeedMew, PaginationDirectionName } from "@/types/types";
import { useInfiniteQuery, useQueryClient } from "@tanstack/vue-query";
import { showError } from "@/utils/toasts";
import BaseMewListItem from "@/components/BaseMewListItem.vue";
import BaseMewListSkeleton from "@/components/BaseMewListSkeleton.vue";
import BaseEmptyList from "@/components/BaseEmptyList.vue";
import { onBeforeRouteLeave } from "vue-router";
import IconPaw from "~icons/ion/paw";

const client = (inject("client") as ComputedRef<AppAgentClient>).value;
const queryClient = useQueryClient();
const pageLimit = 10;

const fetchMewsFeed = (params: any): Promise<FeedMew[]> =>
  client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "get_followed_creators_mews_with_context",
    payload: {
      agent: client.myPubKey,
      page: {
        limit: pageLimit,
        direction: { [PaginationDirectionName.Descending]: null },
        ...params.pageParam,
      },
    },
  });

const { data, error, fetchNextPage, hasNextPage, isLoading, refetch } =
  useInfiniteQuery<FeedMew[]>({
    queryKey: [
      "mews",
      "get_followed_creators_mews_with_context",
      encodeHashToBase64(client.myPubKey),
    ],
    queryFn: fetchMewsFeed,
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
        "get_followed_creators_mews_with_context",
        encodeHashToBase64(client.myPubKey),
      ],
      (d: any) => ({
        pages: [d.pages[0]],
        pageParams: [d.pageParams[0]],
      })
    );
  }
});
</script>
