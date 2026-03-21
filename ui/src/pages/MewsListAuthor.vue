<template>
  <div class="w-full">
    <div class="flex justify-start items-center space-x-2 mb-8">
      <BaseButtonBack />

      <h1 class="flex justify-start items-center space-x-4">
        <div class="text-2xl font-title font-bold tracking-tighter">
          mews by
        </div>
        <BaseAgentProfileLinkName
          v-if="agentPubKey"
          class="q-ml-md"
          :agentPubKey="agentPubKey"
          :avatar-size="30"
          :enable-popup="false"
        />
      </h1>
    </div>

    <BaseInfiniteScroll
      v-if="
        data && data.pages && data.pages.length > 0 && data.pages[0].length > 0
      "
      @load-next="fetchNextPageInfiniteScroll"
    >
      <template v-for="(page, i) in data.pages" :key="i">
        <template v-for="(mew, j) of page" :key="j">
          <BaseMewListItem
            :feed-mew="mew"
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
    </BaseInfiniteScroll>

    <BaseListSkeleton v-else-if="isInitialLoading" :count="4">
      <BaseMewListItemSkeleton />
    </BaseListSkeleton>
    <BaseEmptyList v-else />
  </div>
</template>

<script setup lang="ts">
import { AppClient } from "@holochain/client";
import { ComputedRef, computed, inject, watch } from "vue";
import { useCellsReady } from "@/composables/useCellsReady";
import { useRoute, onBeforeRouteLeave } from "vue-router";
import { useInfiniteQuery, useQueryClient } from "@tanstack/vue-query";
import BaseEmptyList from "@/components/BaseEmptyList.vue";
import BaseMewListItem from "@/components/BaseMewListItem.vue";
import BaseAgentProfileLinkName from "@/components/BaseAgentProfileLinkName.vue";
import { decodeHashFromBase64 } from "@holochain/client";
import BaseButtonBack from "@/components/BaseButtonBack.vue";
import BaseInfiniteScroll from "@/components/BaseInfiniteScroll.vue";
import BaseListSkeleton from "@/components/BaseListSkeleton.vue";
import BaseMewListItemSkeleton from "@/components/BaseMewListItemSkeleton.vue";
import { wrapInput } from "@/utils/zomeCall";
import { usePatchFeedMew } from "@/composables/usePatchFeedMew";
import { FeedMew } from "@/types/types";

const route = useRoute();
const client = (inject("client") as ComputedRef<AppClient>).value;
const cellsReady = useCellsReady();
const queryClient = useQueryClient();
const { patchFeedMew } = usePatchFeedMew();
const agentPubKeyB64 = computed(() => route.params.agentPubKey);
const agentPubKey = computed(() => {
  const key = route.params.agentPubKey as string;
  return key ? decodeHashFromBase64(key) : undefined;
});
const hasAgentPubKey = computed(() => agentPubKey.value !== undefined);

const pageLimit = 10;

const fetchAuthoredMews = async (params: any) => {
  if (!agentPubKey.value) return [];
  const res = await client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "get_agent_mews_with_context",
    payload: wrapInput({
      agent: agentPubKey.value,
      page: {
        limit: pageLimit,
        ...params.pageParam,
      },
    }),
  });
  return res;
};

const queryKey = ["mews", "get_agent_mews_with_context", agentPubKeyB64];

const patchMew = (updatedMew: FeedMew) => {
  patchFeedMew(queryKey, updatedMew);
};

const { data, error, fetchNextPage, hasNextPage, isInitialLoading } =
  useInfiniteQuery({
    queryKey,
    queryFn: fetchAuthoredMews,
    getNextPageParam: (lastPage) => {
      if (lastPage.length === 0) return;
      if (lastPage.length < pageLimit) return;

      return { after_hash: lastPage[lastPage.length - 1].action_hash };
    },
    refetchInterval: 1000 * 60 * 2, // 2 minutes
    refetchOnMount: true,
    enabled: computed(() => cellsReady.value && hasAgentPubKey.value),
  });

const fetchNextPageInfiniteScroll = async (
  done: (hasMore?: boolean) => void
) => {
  await fetchNextPage();
  done(hasNextPage?.value);
};

watch(error, console.error);

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
