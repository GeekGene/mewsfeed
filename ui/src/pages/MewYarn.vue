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
        class="bg-gray-100 rounded-3xl mb-8"
        @mew-deleted="refetchMewAndRepliesPage(0)"
        @mew-licked="refetchMewAndRepliesPage(0)"
        @mew-pinned="refetchMewAndRepliesPage(0)"
        @mew-unlicked="refetchMewAndRepliesPage(0)"
        @mew-unpinned="refetchMewAndRepliesPage(0)"
        @mewmew-created="refetchMewAndRepliesPage(0)"
        @quote-created="refetchMewAndRepliesPage(0)"
        @reply-created="refetchMewAndRepliesPage(0)"
      />
      <BaseMewListItemSkeleton v-else-if="isLoadingMew" />
    </div>

    <h2 class="text-xl font-title font-bold tracking-tighter mb-2">replies</h2>
    <QInfiniteScroll
      v-if="replies && replies.pages.length > 0 && replies.pages[0].length > 0"
      :offset="250"
      @load="fetchNextPageReplies"
    >
      <template v-for="(page, i) in replies.pages" :key="i">
        <template v-for="(reply, j) of page" :key="j">
          <BaseMewListItem
            :feed-mew="reply"
            :show-yarn-link="false"
            @mew-deleted="refetchRepliesPage(i)"
            @mew-licked="refetchRepliesPage(i)"
            @mew-pinned="refetchRepliesPage(i)"
            @mew-unlicked="refetchRepliesPage(i)"
            @mew-unpinned="refetchRepliesPage(i)"
            @mewmew-created="refetchRepliesPage(i)"
            @quote-created="refetchRepliesPage(i)"
            @reply-created="refetchRepliesPage(i)"
          />
        </template>
      </template>
      <template #loading>
        <div class="flex justify-center">
          <div class="loading loading-dots loading-sm"></div>
        </div>
      </template>
      <div
        v-if="!hasNextPage"
        class="flex justify-center mb-8 text-base-300 text-2xl"
      >
        <IconPaw />
      </div>
    </QInfiniteScroll>
    <BaseMewListSkeleton v-else-if="isLoadingReplies" />
    <BaseEmptyList v-else />
  </div>
</template>

<script setup lang="ts">
import { QInfiniteScroll } from "quasar";
import BaseMewListItem from "@/components/BaseMewListItem.vue";
import BaseMewListItemSkeleton from "@/components/BaseMewListItemSkeleton.vue";
import { PaginationDirectionName } from "@/types/types";
import { decodeHashFromBase64 } from "@holochain/client";
import { ComputedRef, computed, inject, watch } from "vue";
import { useRoute, onBeforeRouteLeave } from "vue-router";
import { AppAgentClient } from "@holochain/client";
import { showError } from "@/utils/toasts";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/vue-query";
import BaseButtonBack from "@/components/BaseButtonBack.vue";
import IconPaw from "~icons/ion/paw";

const client = (inject("client") as ComputedRef<AppAgentClient>).value;
const route = useRoute();
const queryClient = useQueryClient();

const pageLimit = 10;

const actionHash = computed(() =>
  decodeHashFromBase64(route.params.actionHash as string)
);
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
  isLoading: isLoadingMew,
  refetch: refetchMew,
} = useQuery({
  queryKey: ["mews", "get_mew_with_context", route.params.actionHash as string],
  queryFn: fetchMew,
  enabled: hasActionHash,
  refetchInterval: 1000 * 60 * 2, // 2 minutes
});
watch(mewError, showError);

const fetchReplies = (params: any) =>
  client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "get_responses_for_mew_with_context",
    payload: {
      original_mew_hash: mew?.value.action_hash,
      page: {
        limit: pageLimit,
        direction: { [PaginationDirectionName.Ascending]: null },
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
  isLoading: isLoadingReplies,
  refetch: refetchReplies,
} = useInfiniteQuery({
  queryKey: [
    "mews",
    "get_responses_for_mew_with_context",
    route.params.actionHash as string,
  ],
  queryFn: fetchReplies,
  enabled: hasMew,
  getNextPageParam: (lastPage) => {
    if (lastPage.length === 0) return;
    if (lastPage.length < pageLimit) return;

    return { after_hash: lastPage[lastPage.length - 1].action_hash };
  },
  refetchInterval: 1000 * 60 * 2, // 2 minutes
});
watch(errorReplies, showError);

const fetchNextPageReplies = async (
  index: number,
  done: (stop?: boolean) => void
) => {
  await fetchNextPage();
  done(!hasNextPage?.value);
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

const refetchMewAndRepliesLastPage = async () => {
  await refetchMew();

  if (
    !mew.value.replies ||
    !replies.value ||
    replies.value.pages.length === 0
  ) {
    await refetchRepliesPage(0);
  } else if (
    mew.value.replies.length <
    replies.value.pages.length * pageLimit
  ) {
    await refetchRepliesPage(replies.value.pages.length - 1);
  } else {
    await refetchRepliesPage(replies.value.pages.length - 1);
    await fetchNextPage();
  }
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
