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
          <div class="font-bold">Op Bytes to Fetch</div>
          <div>{{ data[0]?.fetch_pool_info.op_bytes_to_fetch }}</div>
        </div>
        <div class="flex justify-start items-center space-x-2 text-xs mb-2">
          <div class="font-bold">Num Ops to Fetch</div>
          <div>{{ data[0]?.fetch_pool_info.num_ops_to_fetch }}</div>
        </div>
        <div class="flex justify-start items-center space-x-2 text-xs">
          <div class="font-bold">Current Peers</div>
          <div>{{ data[0]?.current_number_of_peers }}</div>
        </div>
        <div class="flex justify-start items-center space-x-2 text-xs mb-2">
          <div class="font-bold">Total Network Peers</div>
          <div>{{ data[0]?.total_network_peers }}</div>
        </div>
        <div class="flex justify-start items-center space-x-2 text-xs">
          <div class="font-bold">Bytes Since Last Queried</div>
          <div>{{ data[0]?.bytes_since_last_time_queried }} bytes</div>
        </div>
        <div class="flex justify-start items-center space-x-2 text-xs">
          <div class="font-bold">Completed Rounds Since Last Queried</div>
          <div>{{ data[0]?.completed_rounds_since_last_time_queried }}</div>
        </div>
        <IconCloseCircleOutline class="absolute bottom-2 right-2" />
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
  AppInfo,
  CellType,
  NetworkInfoResponse,
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
const appInfo = (inject("appInfo") as ComputedRef<AppInfo>).value;

const showExpanded = ref(false);
const lastUpdated = computed(() => dataUpdatedAt.value);
const lastUpdatedSeconds = ref(0);

const fetchNetworkInfo = (): Promise<NetworkInfoResponse> =>
  client.networkInfo({
    dnas: [
      (appInfo.cell_info.mewsfeed[0] as any)[CellType.Provisioned].cell_id[0],
    ],
    last_time_queried: lastUpdated.value,
  });

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
