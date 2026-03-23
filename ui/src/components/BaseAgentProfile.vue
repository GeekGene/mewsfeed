<template>
  <div class="flex justify-start items-center space-x-2">
    <BaseAgentAvatar
      :agentPubKey="agentPubKey"
      :profile="profile"
      :size="20"
    />
    <BaseAgentProfileName :agent-pub-key="agentPubKey" />
  </div>
</template>

<script setup lang="ts">
import { AgentPubKey } from "@holochain/client";
import { computed } from "vue";
import BaseAgentAvatar from "./BaseAgentAvatar.vue";
import BaseAgentProfileName from "./BaseAgentProfileName.vue";
import { useProfile } from "@/composables/useProfile";

const props = defineProps<{
  agentPubKey: AgentPubKey;
}>();

const { profile } = useProfile(computed(() => props.agentPubKey));
</script>
