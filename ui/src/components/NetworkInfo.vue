<template>
  <div>
    <div
      v-if="showExpanded"
      class="w-96 z-10 bg-warning text-warning-content rounded-lg p-4"
      @click="showExpanded = false"
    >
      <div v-if="!data" class="text-lg">Network data unavailable</div>
      <template v-else>
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg">Network Info</h3>
          <div class="text-xs">Updated {{ lastUpdatedSeconds }}s ago</div>
        </div>
        <div class="flex justify-start items-center space-x-2 text-xs">
          <div class="font-bold">Backend</div>
          <div>{{ data.backend }}</div>
        </div>
        <div class="flex justify-start items-center space-x-2 text-xs mb-2">
          <div class="font-bold">Peer URLs</div>
          <div>{{ data.peer_urls?.length || 0 }}</div>
        </div>
        <div class="flex justify-start items-center space-x-2 text-xs">
          <div class="font-bold">Active Connections</div>
          <div>{{ data.connections?.length || 0 }}</div>
        </div>
        <div v-if="data.connections?.length" class="mt-2 text-xs">
          <div class="font-bold mb-1">Connection Details:</div>
          <div v-for="conn in data.connections.slice(0, 3)" :key="conn.pub_key" class="ml-2">
            <div>Messages: {{ conn.send_message_count }} sent</div>
          </div>
          <div v-if="data.connections.length > 3" class="ml-2 text-xs opacity-70">
            ... and {{ data.connections.length - 3 }} more
          </div>
        </div>
        <IconCloseCircleOutline class="absolute top-1 right-1" />
      </template>
    </div>
    <div
      v-else
      class="flex justify-start items-center space-x-2 badge badge-warning py-4"
      @click="showExpanded = true"
    >
      <IconStatsChart />
      <div>Network Info</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  AppClient,
  AppDumpNetworkStatsResponse,
} from "@holochain/client";
import { useQuery } from "@tanstack/vue-query";
import { computed, ref } from "vue";
import { ComputedRef, inject, watch } from "vue";
import IconStatsChart from "~icons/ion/stats-chart";
import IconCloseCircleOutline from "~icons/ion/close-circle-outline";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

const client = (inject("client") as ComputedRef<AppClient>).value;

const showExpanded = ref(false);
const lastUpdatedSeconds = ref(0);

const fetchNetworkInfo = (): Promise<AppDumpNetworkStatsResponse> =>
  client.dumpNetworkStats();

const { data, error, dataUpdatedAt } = useQuery({
  queryKey: ["networkInfo"],
  queryFn: fetchNetworkInfo,
  refetchInterval: 1000 * 15, // 15 seconds
  refetchIntervalInBackground: true,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  cacheTime: 0,
});
watch(error, console.error);

setInterval(() => {
  if (dataUpdatedAt) {
    lastUpdatedSeconds.value = Math.floor(
      Date.now() / 1000 - dataUpdatedAt.value / 1000
    );
  }
}, 1000);
</script>
