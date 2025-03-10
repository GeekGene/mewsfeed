<template>
  <div :style-fn="pageHeightCorrection">
    <h1 class="text-2xl font-title font-bold tracking-tighter mb-8">
      notifications
    </h1>

    <BaseInfiniteScroll
      v-if="
        data && data.pages && data.pages.length > 0 && data.pages[0].length > 0
      "
      @load-next="fetchNextPageInfiniteScroll"
    >
      <template v-for="(page, i) in data?.pages" :key="i">
        <template v-for="(notification, j) of page" :key="j">
          <BaseNotification
            v-observe-visibility="{
              callback: () => markRead(toRaw(notification)),
              once: true,
            }"
            :notification="notification"
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
import { AppClient, encodeHashToBase64 } from "@holochain/client";
import { inject, ComputedRef, watch, toRaw, computed } from "vue";
import { onBeforeRouteLeave } from "vue-router";
import { pageHeightCorrection } from "@/utils/page-layout";
import BaseNotification from "@/components/BaseNotification.vue";
import BaseEmptyList from "@/components/BaseEmptyList.vue";
import { useInfiniteQuery, useQueryClient } from "@tanstack/vue-query";
import { makeUseNotificationsReadStore } from "@/stores/notificationsRead";
import { PaginationDirectionName, Notification } from "@/types/types";
import BaseListSkeleton from "@/components/BaseListSkeleton.vue";
import BaseMewListItemSkeleton from "@/components/BaseMewListItemSkeleton.vue";
import BaseInfiniteScroll from "@/components/BaseInfiniteScroll.vue";

const client = (inject("client") as ComputedRef<AppClient>).value;
const useNotificationsReadStore = makeUseNotificationsReadStore(client);
const { markRead, addNotificationStatus } = useNotificationsReadStore();
const queryClient = useQueryClient();
const myPubKeyB64 = computed(() => encodeHashToBase64(client.myPubKey));

const pageLimit = 10;

const fetchNotifications = async (params: any) => {
  const res: Notification[] = await client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "get_notifications_for_agent",
    payload: {
      agent: client.myPubKey,
      page: {
        limit: pageLimit,
        direction: PaginationDirectionName.Descending,
        ...params.pageParam,
      },
    },
  });
  res.forEach((n) => addNotificationStatus(n, true));
  return res;
};

const { data, error, fetchNextPage, hasNextPage, refetch, isInitialLoading } =
  useInfiniteQuery({
    queryKey: ["mews", "get_notifications_for_agent", myPubKeyB64],
    queryFn: fetchNotifications,
    getNextPageParam: (lastPage) => {
      if (lastPage.length === 0) return;
      if (lastPage.length < pageLimit) return;

      return { after_timestamp: lastPage[lastPage.length - 1].timestamp };
    },
    refetchInterval: 1000 * 60 * 2, // 2 minutes
    refetchOnMount: true,
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
      ["mews", "get_notifications_for_agent", myPubKeyB64],
      (d: any) => ({
        pages: [d.pages[0]],
        pageParams: [d.pageParams[0]],
      })
    );
  }
});
</script>
