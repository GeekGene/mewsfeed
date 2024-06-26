<template>
  <div
    class="bg-base-200 rounded-lg p-3 flex items-center space-x-4 text-xs text-base-content"
  >
    <IconPaw />
    <div>{{ text }}</div>
  </div>
</template>

<script setup lang="ts">
import IconPaw from "~icons/ion/paw";
defineProps({ text: { type: String, default: "Meeow, nothing here yet" } });
</script>
