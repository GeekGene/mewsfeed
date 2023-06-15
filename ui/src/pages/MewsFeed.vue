<template>
  <QPage class="q-pb-lg" :style-fn="pageHeightCorrection">
    <CreateMewField
      :mew-type="{ [MewTypeName.Original]: null }"
      @mew-created="onCreateMew"
    />

    <h6 class="q-mb-md">Your Mews Feed</h6>

    <QInfiniteScroll
      v-if="
        data && data.pages && data.pages.length > 0 && data.pages[0].length > 0
      "
      :offset="250"
      @load="fetchNextPageInfiniteScroll"
    >
      <QList bordered separator class="q-mb-lg">
        <template v-for="(page, i) in data.pages" :key="i">
          <BaseMewListItem
            v-for="(mew, j) of page"
            :key="j"
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
      </QList>

      <template #loading>
        <div class="row justify-center q-mt-lg">
          <QSpinnerDots color="primary" size="40px" />
        </div>
      </template>
      <div v-if="!hasNextPage" class="row justify-center q-mt-lg">
        <QIcon name="svguse:/icons.svg#paw" size="40px" color="grey-4" />
      </div>
    </QInfiniteScroll>
    <BaseMewListSkeleton v-else-if="isLoading" />
    <BaseEmptyMewsFeed v-else />
  </QPage>
</template>

<script setup lang="ts">
import { QPage, QList, QSpinnerDots, QIcon, QInfiniteScroll } from "quasar";
import { pageHeightCorrection } from "@/utils/page-layout";
import { AppAgentClient, encodeHashToBase64 } from "@holochain/client";
import { ComputedRef, inject, watch } from "vue";
import { FeedMew, MewTypeName, PaginationDirectionName } from "@/types/types";
import { useInfiniteQuery, useQueryClient } from "@tanstack/vue-query";
import { showError } from "@/utils/toasts";
import BaseMewListItem from "@/components/BaseMewListItem.vue";
import BaseMewListSkeleton from "@/components/BaseMewListSkeleton.vue";
import CreateMewField from "@/components/CreateMewField.vue";
import BaseEmptyMewsFeed from "@/components/BaseEmptyMewsFeed.vue";
import { onBeforeRouteLeave } from "vue-router";

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

const onCreateMew = () => {
  refetch({ refetchPage: (page, index) => index === 0 });
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
