<template>
  <div class="w-full">
    <div class="flex justify-start items-center space-x-2 mb-8">
      <BaseButtonBack />

      <h1 class="text-2xl font-title font-bold tracking-tighter">yarn</h1>
    </div>

    <div>
      <BaseMewListItem
        v-if="mew"
        :feed-mew="mew"
        :disable-truncate-content="true"
        class="bg-base-200 rounded-3xl mb-8 !cursor-default"
        @mew-deleted="refetchMewAndRepliesPage(0)"
        @mew-licked="refetchMewAndRepliesPage(0)"
        @mew-pinned="refetchMewAndRepliesPage(0)"
        @mew-unlicked="refetchMewAndRepliesPage(0)"
        @mew-unpinned="refetchMewAndRepliesPage(0)"
        @mewmew-created="refetchMewAndRepliesPage(0)"
        @quote-created="refetchMewAndRepliesPage(0)"
        @reply-created="refetchMewAndRepliesPage(0)"
      />
      <BaseMewListItemSkeleton v-else-if="isInitialLoadingMew" />
    </div>

    <h2 class="text-xl font-title font-bold tracking-tighter mb-2">replies</h2>
    <BaseInfiniteScroll
      v-if="replies && replies.pages.length > 0 && replies.pages[0].length > 0"
      @load-next="fetchNextPageReplies"
    >
      <template v-for="(page, i) in replies.pages" :key="i">
        <template v-for="(reply, j) of page" :key="j">
          <BaseMewListItem
            :feed-mew="reply"
            :enable-yarn-link="false"
            @mew-deleted="refetchRepliesPage(i)"
            @mew-licked="refetchRepliesPage(i)"
            @mew-pinned="refetchRepliesPage(i)"
            @mew-unlicked="refetchRepliesPage(i)"
            @mew-unpinned="refetchRepliesPage(i)"
            @mewmew-created="refetchRepliesPage(i)"
            @quote-created="refetchRepliesPage(i)"
            @reply-created="refetchRepliesPage(i)"
          />
          <hr v-if="j !== page.length - 1" class="border-base-300" />
        </template>
      </template>
    </BaseInfiniteScroll>
    <BaseListSkeleton v-else-if="isInitialLoadingReplies" :count="4">
      <BaseMewListItemSkeleton />
    </BaseListSkeleton>
    <BaseEmptyList v-else />
  </div>
</template>

<script setup lang="ts">
import BaseMewListItem from "@/components/BaseMewListItem.vue";
import BaseMewListItemSkeleton from "@/components/BaseMewListItemSkeleton.vue";
import { PaginationDirectionName } from "@/types/types";
import { decodeHashFromBase64 } from "@holochain/client";
import { ComputedRef, computed, inject, watch } from "vue";
import { useRoute, onBeforeRouteLeave } from "vue-router";
import { AppClient } from "@holochain/client";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/vue-query";
import BaseButtonBack from "@/components/BaseButtonBack.vue";
import BaseListSkeleton from "@/components/BaseListSkeleton.vue";
import BaseInfiniteScroll from "@/components/BaseInfiniteScroll.vue";

const client = (inject("client") as ComputedRef<AppClient>).value;
const route = useRoute();
const queryClient = useQueryClient();

const pageLimit = 10;

const actionHash = computed(() =>
  decodeHashFromBase64(route.params.actionHash as string)
);
const actionHashB64 = computed(() => route.params.actionHash);
const hasActionHash = computed(() => actionHash.value !== undefined);

const fetchMew = () =>
  client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "get_mew_with_context",
    payload: actionHash.value,
  });

const {
  data: mew,
  error: mewError,
  isInitialLoading: isInitialLoadingMew,
  refetch: refetchMew,
} = useQuery({
  queryKey: ["mews", "get_mew_with_context", actionHashB64],
  queryFn: fetchMew,
  enabled: hasActionHash,
  refetchInterval: 1000 * 60 * 2, // 2 minutes
});
watch(mewError, console.error);

const fetchReplies = (params: any) =>
  client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "get_responses_for_mew_with_context",
    payload: {
      original_mew_hash: mew?.value.action_hash,
      page: {
        limit: pageLimit,
        direction: PaginationDirectionName.Ascending,
        ...params.pageParam,
      },
    },
  });

const hasMew = computed(() => mew.value !== undefined);

const {
  data: replies,
  error: errorReplies,
  fetchNextPage,
  hasNextPage,
  isInitialLoading: isInitialLoadingReplies,
  refetch: refetchReplies,
} = useInfiniteQuery({
  queryKey: ["mews", "get_responses_for_mew_with_context", actionHashB64],
  queryFn: fetchReplies,
  enabled: hasMew,
  getNextPageParam: (lastPage) => {
    if (lastPage.length === 0) return;
    if (lastPage.length < pageLimit) return;

    return { after_hash: lastPage[lastPage.length - 1].action_hash };
  },
  refetchInterval: 1000 * 60 * 2, // 2 minutes
  refetchOnMount: true,
});
watch(errorReplies, console.error);

const fetchNextPageReplies = async (done: (hasMore?: boolean) => void) => {
  await fetchNextPage();
  done(hasNextPage?.value);
};

const refetchMewAndRepliesPage = async (pageIndex: number) => {
  await refetchMew();
  await refetchRepliesPage(pageIndex);
};

const refetchRepliesPage = async (pageIndex: number) => {
  await refetchReplies({
    refetchPage: (page: any, index: number) => index === pageIndex,
  });
};

onBeforeRouteLeave(() => {
  if (replies.value && replies.value.pages.length > 1) {
    queryClient.setQueryData(
      [
        "mews",
        "get_responses_for_mew_with_context",
        route.params.actionHash as string,
      ],
      (d: any) => ({
        pages: [d.pages[0]],
        pageParams: [d.pageParams[0]],
      })
    );
  }
});
</script>
