<template>
  <BaseAgentProfilesList
    :agent-profiles="data"
    :loading="loading"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
import { AgentProfile } from "@/types/types";
import { showError } from "@/utils/notification";
import { watch } from "vue";
import BaseAgentProfilesList from "./BaseAgentProfilesList.vue";
import { useRequest } from "vue-request";

const props = defineProps<{
  fetchFn: () => Promise<AgentProfile[]>;
  cacheKey: string;
}>();

const { data, loading, error } = useRequest(props.fetchFn, {
  cacheKey: props.cacheKey,
  initialData: [],
  pollingInterval: 120000, // 120 seconds polling
  refreshOnWindowFocus: true,
  refocusTimespan: 10000, // 10 seconds between window focus to trigger refresh
  loadingDelay: 1000,
});
watch(error, showError);
</script>
