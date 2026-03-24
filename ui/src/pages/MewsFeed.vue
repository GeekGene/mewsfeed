<template>
  <div class="w-full">
    <BasePageHeader />

    <MewsFeedBatch v-if="feedStrategy.strategy === 'batch'" />
    <MewsFeedProgressive v-else />
  </div>
</template>

<script setup lang="ts">
import { useFeedStrategyStore } from "@/stores/feedStrategy";
import MewsFeedBatch from "@/components/MewsFeedBatch.vue";
import MewsFeedProgressive from "@/components/MewsFeedProgressive.vue";
const feedStrategy = useFeedStrategyStore();
</script>
