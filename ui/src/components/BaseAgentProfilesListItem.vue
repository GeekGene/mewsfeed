<template>
  <div class="flex justify-start items-center space-x-4">
    <BaseAgentProfileLinkAvatar
      :agentPubKey="agentProfile.agentPubKey"
      :size="30"
      :enable-popup="enablePopup"
    />
    <BaseAgentProfileName
      :profile="agentProfile.profile"
      :agentPubKey="agentProfile.agentPubKey"
    />
  </div>
</template>

<script setup lang="ts">
import { AgentProfile } from "@/types/types";
import BaseAgentProfileLinkAvatar from "@/components/BaseAgentProfileLinkAvatar.vue";
import BaseAgentProfileName from "@/components/BaseAgentProfileName.vue";

withDefaults(
  defineProps<{
    agentProfile: AgentProfile;
    enablePopup?: boolean;
  }>(),
  {
    enablePopup: true,
  }
);
</script>
