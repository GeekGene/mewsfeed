<template>
  <LinkProfilePopup :agent-pub-key="agentPubKey">
    <div class="flex justify-end items-center">
      <agent-avatar
        v-if="profile"
        :agentPubKey="agentPubKey"
        :size="avatarSize"
        disable-tooltip
        disable-copy
        class="q-mr-xs"
      />
      <BaseAgentProfileName :profile="profile" :agentPubKey="agentPubKey" />
    </div>
  </LinkProfilePopup>
</template>

<script setup lang="ts">
import { Profile } from "@holochain-open-dev/profiles";
import { AgentPubKey } from "@holochain/client";
import LinkProfilePopup from "@/components/LinkProfilePopup.vue";
import BaseAgentProfileName from "@/components/BaseAgentProfileName.vue";

withDefaults(
  defineProps<{
    agentPubKey: AgentPubKey;
    profile?: Profile | null;
    avatarSize?: number;
  }>(),
  {
    avatarSize: 20,
    profile: null,
  }
);
</script>

<style scoped></style>
