<template>
  <QPage :style-fn="pageHeightCorrection">
    <BaseButtonBack />
    <h6 class="q-mt-md q-mb-md">Notifications</h6>

    <QInfiniteScroll
      v-if="
        data && data.pages && data.pages.length > 0 && data.pages[0].length > 0
      "
      :offset="250"
      @load="fetchNextPageInfiniteScroll"
    >
      <QList bordered separator class="q-mb-lg">
        <template v-for="(page, i) in data?.pages" :key="i">
          <BaseNotification
            v-for="(notification, j) of page"
            :key="j"
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
    <BaseMewListSkeleton v-else-if="isInitialLoading" />
    <BaseEmptyList v-else />
  </QPage>
</template>

<script setup lang="ts">
import { AppAgentClient } from "@holochain/client";
import { inject, ComputedRef, watch, toRaw } from "vue";
import { QPage, QInfiniteScroll, QSpinnerDots, QIcon, QList } from "quasar";
import { onBeforeRouteLeave } from "vue-router";
import { pageHeightCorrection } from "@/utils/page-layout";
import BaseNotification from "@/components/BaseNotification.vue";
import BaseEmptyList from "@/components/BaseEmptyList.vue";
import BaseMewListSkeleton from "@/components/BaseMewListSkeleton.vue";
import { showError } from "@/utils/toasts";
import { useInfiniteQuery, useQueryClient } from "@tanstack/vue-query";
import { makeUseNotificationsReadStore } from "@/stores/notificationsRead";
import { PaginationDirectionName, Notification } from "@/types/types";
import BaseButtonBack from "@/components/BaseButtonBack.vue";

const client = (inject("client") as ComputedRef<AppAgentClient>).value;
const useNotificationsReadStore = makeUseNotificationsReadStore(client);
const { markRead, addNotificationStatus } = useNotificationsReadStore();
const queryClient = useQueryClient();

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
        direction: { [PaginationDirectionName.Descending]: null },
        ...params.pageParam,
      },
    },
  });
  res.forEach((n) => addNotificationStatus(n, true));
  return res;
};

const { data, error, fetchNextPage, hasNextPage, refetch, isInitialLoading } =
  useInfiniteQuery({
    queryKey: ["mews", "get_notifications_for_agent", client.myPubKey],
    queryFn: fetchNotifications,
    getNextPageParam: (lastPage) => {
      if (lastPage.length === 0) return;
      if (lastPage.length < pageLimit) return;

      return { after_timestamp: lastPage[lastPage.length - 1].timestamp };
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
      ["mews", "get_notifications_for_agent", client.myPubKey],
      (d: any) => ({
        pages: [d.pages[0]],
        pageParams: [d.pageParams[0]],
      })
    );
  }
});
</script>
