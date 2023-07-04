<template>
  <div class="w-full">
    <div class="w-full">
      <slot></slot>
    </div>

    <div
      v-observe-visibility="loadNextDebounced"
      class="h-16 w-full flex justify-center items-center"
    >
      <div
        v-if="loading || hasMore === undefined"
        class="loading loading-dots loading-md text-base-300 text-2xl"
      ></div>
      <IconPaw v-else-if="hasMore === false" class="text-base-300 text-2xl" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { debounce } from "lodash";
import { ref } from "vue";
import IconPaw from "~icons/ion/paw";

const emit = defineEmits(["load-next"]);

const loading = ref<boolean>(false);
const hasMore = ref<boolean>();

const loadNext = (visible: any) => {
  if (!visible || loading.value) return;

  loading.value = true;
  emit("load-next", (val: boolean) => {
    loading.value = false;
    hasMore.value = val;
  });
};
const loadNextDebounced = debounce(loadNext, 250);
</script>
