<template>
  <div class="q-mx-sm q-my-sm">
    <MewContent :mew="embedMew.mew as Mew" class="cursor-pointer q-mb-sm" />
    <BaseAgentProfile
      :agent-pub-key="embedMew.action.author"
      :profile="embedMew.author_profile"
    />
  </div>
</template>

<script setup lang="ts">
import { EmbedMew } from "@/types/types";
import { Mew } from "@/types/types";
import MewContent from "@/components/MewContent.vue";
import BaseAgentProfile from "@/components/BaseAgentProfile.vue";

defineProps<{
  embedMew: EmbedMew;
}>();
</script>

<style scoped></style>
