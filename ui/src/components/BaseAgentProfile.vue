<template>
  <div class="flex justify-start items-center space-x-2">
    <agent-avatar
      :agentPubKey="agentPubKey"
      size="20"
      disable-tooltip
      disable-copy
      class="q-mr-xs"
    />
    <BaseAgentProfileName :agent-pub-key="agentPubKey" />
  </div>
</template>

<script setup lang="ts">
import { AgentPubKey } from "@holochain/client";
import BaseAgentProfileName from "./BaseAgentProfileName.vue";

defineProps<{
  agentPubKey: AgentPubKey;
}>();
</script>

<style scoped></style>
