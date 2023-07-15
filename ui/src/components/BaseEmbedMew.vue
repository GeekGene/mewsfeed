<template>
  <div>
    <BaseMewContent :mew="(embedMew.mew as Mew)" class="cursor-pointer mb-2" />
    <BaseAgentProfile
      :agent-pub-key="embedMew.action.author"
      :profile="embedMew.author_profile"
      class="flex justify-end"
    />
  </div>
</template>

<script setup lang="ts">
import { EmbedMew } from "@/types/types";
import { Mew } from "@/types/types";
import BaseMewContent from "@/components/BaseMewContent.vue";
import BaseAgentProfile from "@/components/BaseAgentProfile.vue";

defineProps<{
  embedMew: EmbedMew;
}>();
</script>

<style scoped></style>
