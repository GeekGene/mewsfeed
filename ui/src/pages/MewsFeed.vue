<template>
  <div class="w-full">
    <h1 class="text-2xl font-title font-bold tracking-tighter mb-8">
      mewsfeed
    </h1>

    <BaseInfiniteScroll
      v-if="
        data && data.pages && data.pages.length > 0 && data.pages[0].length > 0
      "
      @load-next="fetchNextPageInfiniteScroll"
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
    </BaseInfiniteScroll>
    <BaseListSkeleton v-else-if="isLoading" :count="5">
      <BaseMewListItemSkeleton />
    </BaseListSkeleton>
    <BaseEmptyList v-else />
  </div>
</template>

<script setup lang="ts">
import { AppAgentClient, encodeHashToBase64 } from "@holochain/client";
import { ComputedRef, inject, watch } from "vue";
import { FeedMew, PaginationDirectionName } from "@/types/types";
import { useInfiniteQuery, useQueryClient } from "@tanstack/vue-query";
import { useToasts } from "@/stores/toasts";
import BaseMewListItem from "@/components/BaseMewListItem.vue";
import BaseEmptyList from "@/components/BaseEmptyList.vue";
import BaseListSkeleton from "@/components/BaseListSkeleton.vue";
import BaseMewListItemSkeleton from "@/components/BaseMewListItemSkeleton.vue";
import BaseInfiniteScroll from "@/components/BaseInfiniteScroll.vue";
import { onBeforeRouteLeave } from "vue-router";

const client = (inject("client") as ComputedRef<AppAgentClient>).value;
const queryClient = useQueryClient();
const { showError } = useToasts();
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
  done: (hasMore?: boolean) => void
) => {
  await fetchNextPage();
  done(hasNextPage?.value);
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
