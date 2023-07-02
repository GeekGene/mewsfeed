<template>
  <div class="flex flex-col space-y-8">
    <template v-for="i in range(props.count)" :key="i">
      <slot></slot>
    </template>
  </div>
</template>

<script setup lang="ts">
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
