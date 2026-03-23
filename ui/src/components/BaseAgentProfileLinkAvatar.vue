<template>
  <BaseLinkProfilePopup
    :agentPubKey="agentPubKey"
    :enabled="enablePopup"
    popup-class="mt-11"
  >
    <div class="pr-4">
      <BaseAgentAvatar
        :agentPubKey="agentPubKey"
        :profile="profile"
        :size="size"
      />
    </div>
  </BaseLinkProfilePopup>
</template>

<script setup lang="ts">
import BaseLinkProfilePopup from "@/components/BaseLinkProfilePopup.vue";
import BaseAgentAvatar from "@/components/BaseAgentAvatar.vue";
import { useProfile } from "@/composables/useProfile";
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    agentPubKey: Uint8Array;
    size?: number;
    enablePopup?: boolean;
  }>(),
  {
    size: 50,
    enablePopup: true,
  }
);

const { profile } = useProfile(computed(() => props.agentPubKey));
</script>
