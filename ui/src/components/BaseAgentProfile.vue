<template>
  <div class="flex justify-start items-center space-x-2">
    <agent-avatar
      :agentPubKey="agentPubKey"
      size="20"
      disable-tooltip
      disable-copy
      class="q-mr-xs"
    />
    <BaseAgentProfileName :agent-pub-key="agentPubKey" :profile="profile" />
  </div>
</template>

<script setup lang="ts">
import { Profile } from "@holochain-open-dev/profiles";
import { AgentPubKey } from "@holochain/client";
import BaseAgentProfileName from "./BaseAgentProfileName.vue";

defineProps<{
  agentPubKey: AgentPubKey;
  profile?: Profile | null;
}>();
</script>

<style scoped></style>
