<template>
  <div>
    <h2 v-if="title" class="text-xl font-title font-bold tracking-tighter mb-2">
      {{ title }}
    </h2>

    <div v-if="items && items.length > 0">
      <template v-for="(item, i) of items" :key="i">
        <slot :item="item" :index="i"></slot>
        <hr v-if="i !== items.length - 1" class="border-base-300" />
      </template>
      <div class="flex justify-center">
        <button
          v-if="enableMoreButton"
          class="btn btn-xs btn-ghost"
          @click="emit('click-more')"
        >
          View More
        </button>
      </div>
    </div>
    <div v-else-if="isLoading" class="flex justify-center">
      <div class="loading loading-dots loading-sm"></div>
    </div>
    <BaseEmptyList v-else />
  </div>
</template>

<script setup lang="ts">
import BaseEmptyList from "@/components/BaseEmptyList.vue";

withDefaults(
  defineProps<{
    items?: any[];
    isLoading: boolean;
    title?: string;
    enableMoreButton?: boolean;
  }>(),
  {
    items: undefined,
    title: undefined,
    enableMoreButton: false,
  }
);
const emit = defineEmits(["click-more"]);
</script>
