<template>
  <LinkProfilePopup :agentPubKey="agentPubKey">
    <agent-avatar
      :agentPubKey="agentPubKey"
      disable-tooltip
      :size="size || 50"
      class="self-start"
    >
    </agent-avatar>
  </LinkProfilePopup>
</template>

<script setup lang="ts">
import LinkProfilePopup from "@/components/LinkProfilePopup.vue";

defineProps<{
  agentPubKey: Uint8Array;
  size?: number;
}>();
</script>
