<template>
  <div class="column">
    <div 
      v-if="mewContent.mew.mew"
      class="text-body1"
      style="overflow-wrap: anywhere;"
    >
      {{ mewContent.mew.mew.mew }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { FeedMew } from "@/types/types";
import { PropType } from "vue";
defineProps({ mewContent: { type: Object as PropType<FeedMew>, required: true } });
</script>
