<template>
  <BaseLinkProfilePopup :agent-pub-key="agentPubKey" :enabled="enablePopup">
    <div class="flex justify-end items-center space-x-2">
      <agent-avatar
        v-if="profile"
        :agentPubKey="agentPubKey"
        :size="avatarSize"
        disable-tooltip
        disable-copy
      />
      <BaseAgentProfileName :profile="profile" :agentPubKey="agentPubKey" />
    </div>
  </BaseLinkProfilePopup>
</template>

<script setup lang="ts">
import { Profile } from "@holochain-open-dev/profiles";
import { AgentPubKey } from "@holochain/client";
import BaseLinkProfilePopup from "@/components/BaseLinkProfilePopup.vue";
import BaseAgentProfileName from "@/components/BaseAgentProfileName.vue";

withDefaults(
  defineProps<{
    agentPubKey: AgentPubKey;
    profile?: Profile | null;
    avatarSize?: number;
    enablePopup?: boolean;
  }>(),
  {
    avatarSize: 20,
    profile: null,
    enablePopup: true,
  }
);
</script>

<style scoped></style>
