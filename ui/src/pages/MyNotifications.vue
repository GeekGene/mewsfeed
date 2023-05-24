<template>
  <QPage class="text-center" :style-fn="pageHeightCorrection">
    <h6 class="q-mt-none q-mb-md">Notifications</h6>
    <MewListSkeleton v-if="loading || !notifications" />
    <EmptyMewsFeed
      v-else-if="notifications && !loading && notifications.length === 0"
    />
    <QList bordered separator>
      <BaseNotification
        v-for="(notification, i) in notifications"
        :key="i"
        v-observe-visibility="{
          callback: () => markRead(notification),
          once: true,
        }"
        :notification="notification"
      />
    </QList>
  </QPage>
</template>

<script setup lang="ts">
import { AppAgentClient } from "@holochain/client";
import { inject, ComputedRef, watch } from "vue";
import { QPage, QList } from "quasar";
import { pageHeightCorrection } from "@/utils/page-layout";
import BaseNotification from "@/components/BaseNotification.vue";
import EmptyMewsFeed from "@/components/EmptyMewsFeed.vue";
import { showError } from "@/utils/notification";
import { makeUseNotificationsStore } from "@/stores/notifications";
import { storeToRefs } from "pinia";
import { onMounted } from "vue";
const client = (inject("client") as ComputedRef<AppAgentClient>).value;

const useNotificationsStore = makeUseNotificationsStore(client);
const { notifications, loading, error } = storeToRefs(useNotificationsStore());
const { markRead, runAsync } = useNotificationsStore();
watch(error, showError);

onMounted(() => runAsync());
</script>
