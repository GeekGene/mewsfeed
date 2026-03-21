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
        @mew-deleted="patchRootMew"
        @mew-licked="patchRootMew"
        @mew-pinned="patchRootMew"
        @mew-unlicked="patchRootMew"
        @mew-unpinned="patchRootMew"
        @mewmew-created="patchRootMew"
        @quote-created="patchRootMew"
        @reply-created="patchRootMew"
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
            @mew-deleted="patchReply"
            @mew-licked="patchReply"
            @mew-pinned="patchReply"
            @mew-unlicked="patchReply"
            @mew-unpinned="patchReply"
            @mewmew-created="patchReply"
            @quote-created="patchReply"
            @reply-created="patchReply"
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
import { FeedMew, PaginationDirectionName } from "@/types/types";
import { usePatchFeedMew } from "@/composables/usePatchFeedMew";
import { decodeHashFromBase64 } from "@holochain/client";
import { ComputedRef, computed, inject, watch } from "vue";
import { useCellsReady } from "@/composables/useCellsReady";
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
import { wrapInput } from "@/utils/zomeCall";

const client = (inject("client") as ComputedRef<AppClient>).value;
const cellsReady = useCellsReady();
const route = useRoute();
const queryClient = useQueryClient();
const { patchFeedMew } = usePatchFeedMew();

const pageLimit = 10;

const actionHash = computed(() => {
  const hash = route.params.actionHash as string;
  return hash ? decodeHashFromBase64(hash) : undefined;
});
const actionHashB64 = computed(() => route.params.actionHash);
const hasActionHash = computed(() => actionHash.value !== undefined);

const fetchMew = () => {
  if (!actionHash.value) return null;
  return client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "get_mew_with_context",
    payload: wrapInput(actionHash.value),
  });
};

const mewQueryKey = ["mews", "get_mew_with_context", actionHashB64];

const patchRootMew = (updatedMew: FeedMew) => {
  queryClient.setQueryData(mewQueryKey, updatedMew);
};

const {
  data: mew,
  error: mewError,
  isInitialLoading: isInitialLoadingMew,
} = useQuery({
  queryKey: mewQueryKey,
  queryFn: fetchMew,
  enabled: computed(() => cellsReady.value && hasActionHash.value),
  refetchInterval: 1000 * 60 * 2, // 2 minutes
});
watch(mewError, console.error);

const fetchReplies = (params: any) => {
  if (!mew?.value?.action_hash) return [];
  return client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "get_responses_for_mew_with_context",
    payload: wrapInput({
      original_mew_hash: mew.value.action_hash,
      page: {
        limit: pageLimit,
        direction: PaginationDirectionName.Ascending,
        ...params.pageParam,
      },
    }),
  });
};

const hasMew = computed(() => mew.value !== undefined);

const repliesQueryKey = ["mews", "get_responses_for_mew_with_context", actionHashB64];

const patchReply = (updatedMew: FeedMew) => {
  patchFeedMew(repliesQueryKey, updatedMew);
};

const {
  data: replies,
  error: errorReplies,
  fetchNextPage,
  hasNextPage,
  isInitialLoading: isInitialLoadingReplies,
} = useInfiniteQuery({
  queryKey: repliesQueryKey,
  queryFn: fetchReplies,
  enabled: computed(() => cellsReady.value && hasMew.value),
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


onBeforeRouteLeave(() => {
  if (replies.value && replies.value.pages.length > 1) {
    queryClient.setQueryData(
      repliesQueryKey,
      (d: any) => ({
        pages: [d.pages[0]],
        pageParams: [d.pageParams[0]],
      })
    );
  }
});
</script>
