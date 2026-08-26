<template>
  <div>
    <div
      v-if="showExpanded"
      class="w-96 z-10 bg-warning text-warning-content rounded-lg p-4"
      @click.self="showExpanded = false"
    >
      <template v-if="isHwc">
        <div class="flex justify-between items-center mb-3">
          <h3 class="text-lg font-bold">Linker Status</h3>
          <button class="btn btn-ghost btn-xs" @click="showExpanded = false">
            <IconCloseCircleOutline />
          </button>
        </div>

        <!-- Linker URL -->
        <div class="text-xs opacity-70 mb-3 break-all">
          <span class="font-bold">Linker:</span> {{ linkerUrl || 'Not configured' }}
        </div>

        <!-- Joining service error -->
        <div v-if="connectionState?.joiningServiceError" class="mt-1 mb-3 p-2 rounded bg-error/20 text-xs">
          <div class="font-bold mb-1">Joining Service</div>
          <div class="opacity-80 mb-2">{{ connectionState.joiningServiceError }}</div>
          <button
            class="btn btn-xs btn-outline"
            :disabled="rejoining"
            @click="handleRejoin"
          >
            {{ rejoining ? 'Rejoining...' : 'Rejoin' }}
          </button>
          <div v-if="rejoinError" class="mt-1 opacity-80 text-error">{{ rejoinError }}</div>
        </div>

        <!-- Status rows -->
        <div class="space-y-1.5 mb-3">
          <div class="flex items-center space-x-2 text-xs">
            <span class="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0" :style="{ backgroundColor: '#4caf50' }"></span>
            <span class="font-bold w-20">Extension</span>
            <span>Active</span>
          </div>
          <div class="flex items-center space-x-2 text-xs">
            <span class="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0" :style="{ backgroundColor: connectionState?.httpHealthy ? '#4caf50' : '#f44336' }"></span>
            <span class="font-bold w-20">HTTP</span>
            <span>{{ connectionState?.httpHealthy ? 'Connected' : 'Unreachable' }}</span>
          </div>
          <div class="flex items-center space-x-2 text-xs">
            <span class="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0" :style="{ backgroundColor: connectionState?.wsHealthy ? '#4caf50' : '#f44336' }"></span>
            <span class="font-bold w-20">WebSocket</span>
            <span>{{ connectionState?.wsHealthy ? 'Connected' : 'Disconnected' }}</span>
          </div>
          <div class="flex items-center space-x-2 text-xs">
            <span class="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0" :style="{ backgroundColor: connectionState?.authenticated ? '#4caf50' : connectionState?.wsHealthy ? '#ff9800' : '#f44336' }"></span>
            <span class="font-bold w-20">Auth</span>
            <span>{{ connectionState?.authenticated ? 'Authenticated' : connectionState?.wsHealthy ? 'Not authenticated' : 'N/A' }}</span>
          </div>
        </div>

        <!-- Peer count -->
        <div v-if="connectionState?.peerCount != null" class="flex items-center space-x-2 text-xs">
          <span class="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0" :style="{ backgroundColor: connectionState.peerCount > 0 ? '#4caf50' : '#ff9800' }"></span>
          <span class="font-bold w-20">Peers</span>
          <span>{{ connectionState.peerCount }}</span>
        </div>

        <!-- Uptime -->
        <div v-if="uptimeDisplay" class="text-xs opacity-70 mb-2">
          Connected {{ uptimeDisplay }}
        </div>

        <!-- Reconnection -->
        <div v-if="connectionState?.reconnectAttempt" class="text-xs opacity-70 mb-2">
          Reconnecting (attempt {{ connectionState.reconnectAttempt }}<span v-if="connectionState.nextReconnectMs">, next in {{ Math.round(connectionState.nextReconnectMs / 1000) }}s</span>)
        </div>

        <!-- Error info -->
        <div v-if="connectionState?.lastError" class="mt-2 p-2 rounded bg-error/20 text-xs">
          <div class="font-bold mb-1">{{ errorSummary }}</div>
          <div class="opacity-70 break-all font-mono text-[10px]">{{ connectionState.lastError }}</div>
        </div>

        <!-- Overall status summary -->
        <div class="text-xs opacity-50 mt-3">
          Status: {{ connectionState?.status ?? 'unknown' }}
        </div>
      </template>

      <template v-else>
        <div v-if="!data" class="text-lg">Network data unavailable</div>
        <template v-else>
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg">Network Info</h3>
            <button class="btn btn-ghost btn-xs" @click="showExpanded = false">
              <IconCloseCircleOutline />
            </button>
          </div>
          <div class="text-xs opacity-70 mb-2">Updated {{ lastUpdatedSeconds }}s ago</div>
          <div class="flex justify-start items-center space-x-2 text-xs">
            <div class="font-bold">Backend</div>
            <div>{{ data.transport_stats.backend }}</div>
          </div>
          <div class="flex justify-start items-center space-x-2 text-xs mb-2">
            <div class="font-bold">Peer URLs</div>
            <div>{{ data.transport_stats.peer_urls?.length || 0 }}</div>
          </div>
          <div class="flex justify-start items-center space-x-2 text-xs">
            <div class="font-bold">Active Connections</div>
            <div>{{ data.transport_stats.connections?.length || 0 }}</div>
          </div>
          <div v-if="data.transport_stats.connections?.length" class="mt-2 text-xs">
            <div class="font-bold mb-1">Connection Details:</div>
            <div v-for="conn in data.transport_stats.connections.slice(0, 3)" :key="conn.pub_key" class="ml-2">
              <div>Messages: {{ conn.send_message_count }} sent</div>
            </div>
            <div v-if="data.transport_stats.connections.length > 3" class="ml-2 text-xs opacity-70">
              ... and {{ data.transport_stats.connections.length - 3 }} more
            </div>
          </div>
        </template>
      </template>

      <!-- Feed strategy toggle (available in both HWC and non-HWC) -->
      <div class="mt-3 pt-3 border-t border-warning-content/20">
        <div class="flex justify-between items-center text-xs">
          <span class="font-bold">Feed Strategy</span>
          <button
            class="btn btn-xs"
            @click="feedStrategy.toggle()"
          >
            {{ feedStrategy.strategy }}
          </button>
        </div>
      </div>
    </div>
    <div
      v-else
      class="flex justify-start items-center space-x-2 badge badge-warning py-4 cursor-pointer opacity-50"
      @click="showExpanded = true"
    >
      <template v-if="isHwc">
        <span
          class="inline-block w-2.5 h-2.5 rounded-full"
          :style="{ backgroundColor: statusColor }"
        ></span>
        <div>Linker</div>
        <template v-if="connectionState?.peerCount != null">
          <span class="opacity-60">|</span>
          <span>{{ connectionState.peerCount }} {{ connectionState.peerCount === 1 ? 'peer' : 'peers' }}</span>
        </template>
        <IconInformationCircleOutline class="w-3.5 h-3.5 opacity-60" />
      </template>
      <template v-else>
        <IconStatsChart />
        <div>Network Info</div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  AppClient,
  DumpNetworkStatsResponse,
} from "@holochain/client";
import { useQuery } from "@tanstack/vue-query";
import { computed, ref, onUnmounted, onMounted } from "vue";
import { ComputedRef, inject } from "vue";
import { useCellsReady } from "@/composables/useCellsReady";
import IconStatsChart from "~icons/ion/stats-chart";
import IconCloseCircleOutline from "~icons/ion/close-circle-outline";
import IconInformationCircleOutline from "~icons/ion/information-circle-outline";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { IS_HWC } from "@/utils/client";
import { WebConductorAppClient, type ConnectionState } from "@/hwc";
import { rejoinWithUI } from "@holo-host/web-conductor-client/ui";
import { useFeedStrategyStore } from "@/stores/feedStrategy";
dayjs.extend(relativeTime);

const client = (inject("client") as ComputedRef<AppClient>).value;
const cellsReady = useCellsReady();
const isHwc = IS_HWC;

const feedStrategy = useFeedStrategyStore();
const showExpanded = ref(false);
const lastUpdatedSeconds = ref(0);

// --- HWC linker status ---
const connectionState = ref<ConnectionState | null>(null);
const linkerUrl = computed(() => connectionState.value?.linkerUrl ?? '');
const connectedSince = ref<number | null>(null);
const uptimeDisplay = ref('');
let unsubscribeConnection: (() => void) | null = null;
let uptimeTimer: ReturnType<typeof setInterval> | undefined;

if (isHwc && client) {
  const hwcClient = client as unknown as WebConductorAppClient;
  connectionState.value = hwcClient.getConnectionState();

  if (connectionState.value?.httpHealthy || connectionState.value?.wsHealthy) {
    connectedSince.value = Date.now();
  }

  unsubscribeConnection = hwcClient.onConnection('connection:change', (state) => {
    const wasConnected = connectionState.value?.httpHealthy || connectionState.value?.wsHealthy;
    const isConnected = state.httpHealthy || state.wsHealthy;
    connectionState.value = { ...state };

    if (!wasConnected && isConnected) {
      connectedSince.value = Date.now();
    } else if (wasConnected && !isConnected) {
      connectedSince.value = null;
    }
  });
}

// --- Rejoin ---
const rejoining = ref(false);
const rejoinError = ref('');

async function handleRejoin() {
  if (!isHwc || !client) return;
  const hwcClient = client as unknown as WebConductorAppClient;

  rejoining.value = true;
  rejoinError.value = '';
  try {
    await rejoinWithUI(hwcClient);
    // Refresh connection state
    connectionState.value = hwcClient.getConnectionState();
  } catch (e: any) {
    if (e?.message !== 'Rejoin cancelled') {
      rejoinError.value = e?.message ?? String(e);
    }
  } finally {
    rejoining.value = false;
  }
}

function updateUptime() {
  if (!connectedSince.value) {
    uptimeDisplay.value = '';
    return;
  }
  const seconds = Math.floor((Date.now() - connectedSince.value) / 1000);
  if (seconds < 60) uptimeDisplay.value = `${seconds}s`;
  else if (seconds < 3600) uptimeDisplay.value = `${Math.floor(seconds / 60)}m`;
  else uptimeDisplay.value = `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

onMounted(() => {
  uptimeTimer = setInterval(updateUptime, 1000);
  updateUptime();
});

onUnmounted(() => {
  unsubscribeConnection?.();
  if (uptimeTimer) clearInterval(uptimeTimer);
  if (lastUpdatedTimer) clearInterval(lastUpdatedTimer);
});

const statusColor = computed(() => {
  if (!connectionState.value) return '#9e9e9e';
  const { httpHealthy, wsHealthy, authenticated } = connectionState.value;
  if (httpHealthy && wsHealthy && authenticated) return '#4caf50'; // green: fully connected + authenticated
  if (httpHealthy || wsHealthy) return '#ff9800'; // yellow: connected but not authenticated
  return '#f44336'; // red: not connected
});

const errorSummary = computed(() => {
  const err = connectionState.value?.lastError;
  if (!err) return '';
  if (err.includes('Failed to fetch') || err.includes('NetworkError')) return 'Cannot reach linker server';
  if (err.includes('401')) return 'Authentication rejected (invalid or expired session)';
  if (err.includes('403')) return 'Access denied (tunnel limit or authorization issue)';
  if (err.includes('timeout') || err.includes('Timeout')) return 'Request timed out';
  if (err.includes('linker') || err.includes('Linker')) return 'Linker connection lost';
  if (err.includes('WebSocket') || err.includes('ws')) return 'WebSocket connection failed';
  return 'Connection error';
});

// --- Standard Holochain network stats (disabled for HWC) ---
const fetchNetworkInfo = (): Promise<DumpNetworkStatsResponse> =>
  client.dumpNetworkStats();

const { data, dataUpdatedAt } = useQuery({
  queryKey: ["networkInfo"],
  queryFn: fetchNetworkInfo,
  refetchInterval: 1000 * 15,
  refetchIntervalInBackground: true,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  cacheTime: 0,
  enabled: computed(() => !isHwc && cellsReady.value),
});

let lastUpdatedTimer: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
  lastUpdatedTimer = setInterval(() => {
    if (dataUpdatedAt) {
      lastUpdatedSeconds.value = Math.floor(
        Date.now() / 1000 - dataUpdatedAt.value / 1000
      );
    }
  }, 1000);
});

// Note: uptimeTimer cleanup is already in onUnmounted above
</script>
