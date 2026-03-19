<template>
  <div class="w-full">
    <h1 class="text-2xl font-title font-bold tracking-tighter mb-8 px-4 flex items-center gap-2">
      <img src="/mewsfeed_logo.png" alt="mewsfeed logo" class="w-8 h-8 -scale-x-100" />
      mewsfeed
    </h1>

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
