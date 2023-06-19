<template>
  <div class="row justify-start items-center q-px-none">
    <ProfileAvatarWithPopup
      :agentPubKey="agentProfile.agentPubKey"
      class="q-mr-md"
      :size="30"
    />
    <BaseAgentProfileName
      :profile="agentProfile.profile"
      :agentPubKey="agentProfile.agentPubKey"
    />
  </div>
</template>

<script setup lang="ts">
import { AgentProfile } from "@/types/types";
import ProfileAvatarWithPopup from "@/components/ProfileAvatarWithPopup.vue";
import BaseAgentProfileName from "@/components/BaseAgentProfileName.vue";

defineProps<{
  agentProfile: AgentProfile;
}>();
</script>
