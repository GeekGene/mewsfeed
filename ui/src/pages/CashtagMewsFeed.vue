<template>
  <QPage :style-fn="pageHeightCorrection">
    <h6 class="q-mb-md">
      Mews with {{ route.meta.tag }}{{ route.params.tag }}
    </h6>

    <QInfiniteScroll
      v-if="data && data.pages.length > 0 && data.pages[0].length > 0"
      :offset="250"
      @load="fetchNextPageInfiniteScroll"
    >
      <QList bordered separator>
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
    <MewListSkeleton v-else-if="isLoading" />
    <EmptyMewsFeed v-else />
  </QPage>
</template>

<script setup lang="ts">
import { QPage, QList, QIcon, QSpinnerDots, QInfiniteScroll } from "quasar";
import { pageHeightCorrection } from "@/utils/page-layout";
import { AppAgentClient } from "@holochain/client";
import { ComputedRef, inject } from "vue";
import { useRoute } from "vue-router";
import { useInfiniteQuery } from "@tanstack/vue-query";
import MewListSkeleton from "@/components/MewListSkeleton.vue";
import EmptyMewsFeed from "@/components/EmptyMewsFeed.vue";
import BaseMewListItem from "@/components/BaseMewListItem.vue";
import { watch } from "vue";
import { showError } from "@/utils/toasts";

const route = useRoute();
const client = (inject("client") as ComputedRef<AppAgentClient>).value;

const pageLimit = 5;

const fetchCashtagMews = async (params: any) => {
  console.log("fetchCashtagMews params=", params);
  const res = await client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "get_mews_for_cashtag_with_context",
    payload: {
      cashtag: `${route.meta.tag}${route.params.tag}`,
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
      "get_mews_for_cashtag_with_context",
      `${route.meta.tag}${route.params.tag}`,
    ],
    queryFn: fetchCashtagMews,
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
</script>
