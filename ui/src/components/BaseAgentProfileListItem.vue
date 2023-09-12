<template>
  <div class="flex justify-start items-center space-x-4">
    <BaseAgentProfileLinkAvatar
      :agentPubKey="agentPubKey"
      :size="50"
      :enable-popup="enablePopup"
    />
    <BaseAgentProfileNameLarge
      class="text-lg"
      :profile="profile"
      :agentPubKey="agentPubKey"
    />
  </div>
</template>

<script setup lang="ts">
import BaseAgentProfileLinkAvatar from "@/components/BaseAgentProfileLinkAvatar.vue";
import BaseAgentProfileNameLarge from "@/components/BaseAgentProfileNameLarge.vue";
import { AgentPubKey } from "@holochain/client";
import { Profile } from "@holochain-open-dev/profiles";

withDefaults(
  defineProps<{
    agentPubKey: AgentPubKey;
    profile?: Profile;
    enablePopup?: boolean;
  }>(),
  {
    enablePopup: true,
    profile: undefined,
  }
);
</script>
