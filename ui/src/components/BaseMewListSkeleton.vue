<template>
  <div class="flex flex-col space-y-8">
    <BaseMewListSkeleton v-for="i in range(props.count)" :key="i" />
  </div>
</template>

<script setup lang="ts">
import BaseMewListSkeleton from "@/components/BaseMewListSkeleton.vue";
import { range } from "lodash";

const props = withDefaults(
  defineProps<{
    count?: number;
  }>(),
  {
    count: 3,
  }
);
</script>
