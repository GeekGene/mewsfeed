<template>
  <QPage class="text-center" :style-fn="pageHeightCorrection">
    <h6 class="q-mt-none q-mb-md">Notifications</h6>

    <MewListSkeleton v-if="loading || !data" />
    <EmptyMewsFeed v-else-if="data && !loading && data.length === 0" />
    <QList bordered separator>
      <BaseNotification
        v-for="(notification, i) in data"
        :key="i"
        :notification="notification"
      />
    </QList>
  </QPage>
</template>

<script setup lang="ts">
import { AppAgentClient } from "@holochain/client";
import { inject, ComputedRef, watch } from "vue";
import { useRequest } from "vue-request";
import { Notification } from "@/types/types";
import { QPage, QList } from "quasar";
import { pageHeightCorrection } from "@/utils/page-layout";
import BaseNotification from "@/components/BaseNotification.vue";
import EmptyMewsFeed from "@/components/EmptyMewsFeed.vue";
import { showError } from "@/utils/notification";
const client = (inject("client") as ComputedRef<AppAgentClient>).value;

const fetchNotifications = (): Promise<Notification[]> =>
  client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "get_my_notifications",
    payload: null,
  });

const { data, loading, error } = useRequest(fetchNotifications, {
  cacheKey: `mews/get_my_notifications`,
  pollingInterval: 2 * 60 * 1000,
  refreshOnWindowFocus: true,
  refocusTimespan: 10 * 1000, // 10 seconds between window focus to trigger refresh
  loadingDelay: 1000,
});
watch(error, showError);
</script>
