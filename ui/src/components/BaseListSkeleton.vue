<template>
  <div class="flex flex-col space-y-8 mt-8">
    <template v-for="i in range(props.count)" :key="i">
      <slot></slot>

      <hr v-if="i !== props.count - 1" class="border-base-300" />
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
