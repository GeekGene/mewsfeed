<template>
  <BaseLinkProfilePopup :agentPubKey="agentPubKey">
    <agent-avatar
      :agentPubKey="agentPubKey"
      disable-tooltip
      :size="size || 50"
      class="self-start"
    >
    </agent-avatar>
  </BaseLinkProfilePopup>
</template>

<script setup lang="ts">
import BaseLinkProfilePopup from "@/components/BaseLinkProfilePopup.vue";

defineProps<{
  agentPubKey: Uint8Array;
  size?: number;
}>();
</script>
