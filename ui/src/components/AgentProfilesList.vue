<template>
  <BaseAgentProfilesList
    :agent-profiles="data"
    :loading="loading"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
import { AgentProfile } from "@/types/types";
import { showError } from "@/utils/toasts";
import { watch } from "vue";
import BaseAgentProfilesList from "./BaseAgentProfilesList.vue";
import { useRequest } from "vue-request";
import { localStorageCacheSettings } from "@/utils/requests";

const props = defineProps<{
  fetchFn: () => Promise<AgentProfile[]>;
  cacheKey: string;
}>();

const { data, loading, error } = useRequest(props.fetchFn, {
  cacheKey: props.cacheKey,
  refreshOnWindowFocus: true,
  refocusTimespan: 25000, // 25 seconds between window focus to trigger refresh
  loadingDelay: 1000,
  ...localStorageCacheSettings,
});
watch(error, showError);
</script>
