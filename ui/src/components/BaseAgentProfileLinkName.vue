<template>
  <BaseLinkProfilePopup
    v-if="profile"
    :agent-pub-key="agentPubKey"
    :enabled="enablePopup"
  >
    <div class="flex justify-end items-center space-x-2">
      <BaseAgentAvatar
        :agentPubKey="agentPubKey"
        :profile="profile"
        :size="avatarSize"
      />
      <BaseAgentProfileName :agentPubKey="agentPubKey" />
    </div>
  </BaseLinkProfilePopup>
  <BaseAgentProfileNameSkeleton v-else />
</template>

<script setup lang="ts">
import { AgentPubKey } from "@holochain/client";
import { computed } from "vue";
import { useProfile } from "@/composables/useProfile";
import BaseAgentAvatar from "@/components/BaseAgentAvatar.vue";
import BaseLinkProfilePopup from "@/components/BaseLinkProfilePopup.vue";
import BaseAgentProfileName from "@/components/BaseAgentProfileName.vue";
import BaseAgentProfileNameSkeleton from "@/components/BaseAgentProfileNameSkeleton.vue";

const props = withDefaults(
  defineProps<{
    agentPubKey: AgentPubKey;
    avatarSize?: number;
    enablePopup?: boolean;
  }>(),
  {
    avatarSize: 20,
    enablePopup: true,
  }
);

const { profile } = useProfile(computed(() => props.agentPubKey));
</script>

<style scoped></style>
