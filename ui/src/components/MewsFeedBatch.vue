<template>
  <div class="w-full">
    <BaseInfiniteScroll
      v-if="
        data && data.pages && data.pages.length > 0 && data.pages[0].length > 0
      "
      @load-next="fetchNextPageInfiniteScroll"
    >
      <div class="w-full">
        <template v-for="(page, i) in data.pages" :key="i">
          <template v-for="(mew, j) of page" :key="j">
            <BaseMewListItem
              :feed-mew="mew"
              class="my-4"
              @mew-deleted="patchMew"
              @mew-licked="patchMew"
              @mew-pinned="patchMew"
              @mew-unlicked="patchMew"
              @mew-unpinned="patchMew"
              @mewmew-created="patchMew"
              @quote-created="patchMew"
              @reply-created="patchMew"
            />
            <hr v-if="j !== page.length - 1" class="border-base-300" />
          </template>
        </template>
      </div>
    </BaseInfiniteScroll>
    <BaseListSkeleton v-else-if="isInitialLoading" :count="4">
      <BaseMewListItemSkeleton />
    </BaseListSkeleton>
    <BaseEmptyList v-else />
  </div>
</template>

<script setup lang="ts">
import { AppClient, encodeHashToBase64 } from "@holochain/client";
import { ComputedRef, computed, inject, watch } from "vue";
import { useCellsReady } from "@/composables/useCellsReady";
import { FeedMew, PaginationDirectionName } from "@/types/types";
import { useInfiniteQuery, useQueryClient } from "@tanstack/vue-query";
import { usePatchFeedMew } from "@/composables/usePatchFeedMew";
import { wrapInput } from "@/utils/zomeCall";
import BaseMewListItem from "@/components/BaseMewListItem.vue";
import BaseEmptyList from "@/components/BaseEmptyList.vue";
import BaseListSkeleton from "@/components/BaseListSkeleton.vue";
import BaseMewListItemSkeleton from "@/components/BaseMewListItemSkeleton.vue";
import BaseInfiniteScroll from "@/components/BaseInfiniteScroll.vue";
import { onBeforeRouteLeave } from "vue-router";

const client = (inject("client") as ComputedRef<AppClient>).value;
const cellsReady = useCellsReady();
const queryClient = useQueryClient();
const { patchFeedMew } = usePatchFeedMew();
const myPubKeyB64 = computed(() => encodeHashToBase64(client.myPubKey));
const pageLimit = 10;

const fetchMewsFeed = (params: any): Promise<FeedMew[]> => {
  const start = performance.now();
  return client
    .callZome({
      role_name: "mewsfeed",
      zome_name: "mews",
      fn_name: "get_followed_creators_mews_with_context",
      payload: wrapInput({
        agent: client.myPubKey,
        page: {
          limit: pageLimit,
          direction: PaginationDirectionName.Descending,
          ...params.pageParam,
        },
      }),
    })
    .then((result: FeedMew[]) => {
      console.log(
        `[batch] get_followed_creators_mews_with_context: ${(performance.now() - start).toFixed(0)}ms, ${result.length} mews`
      );
      return result;
    });
};

const queryKey = ["mews", "get_followed_creators_mews_with_context", myPubKeyB64];

const patchMew = (updatedMew: FeedMew) => {
  patchFeedMew(queryKey, updatedMew);
};

const { data, error, fetchNextPage, hasNextPage, isInitialLoading } =
  useInfiniteQuery<FeedMew[]>({
    queryKey,
    queryFn: fetchMewsFeed,
    getNextPageParam: (lastPage) => {
      if (lastPage.length === 0) return;
      if (lastPage.length < pageLimit) return;

      return { after_hash: lastPage[lastPage.length - 1].action_hash };
    },
    refetchInterval: 1000 * 60 * 2, // 2 minutes
    refetchOnMount: true,
    enabled: cellsReady,
  });
watch(error, console.error);

const fetchNextPageInfiniteScroll = async (
  done: (hasMore?: boolean) => void
) => {
  await fetchNextPage();
  done(hasNextPage?.value);
};

onBeforeRouteLeave(() => {
  if (data.value && data.value.pages.length > 1) {
    queryClient.setQueryData(
      queryKey,
      (d: any) => ({
        pages: [d.pages[0]],
        pageParams: [d.pageParams[0]],
      })
    );
  }
});
</script>
