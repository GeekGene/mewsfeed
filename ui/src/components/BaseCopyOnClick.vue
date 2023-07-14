<template>
  <div
    v-tooltip.top="{
      content: props.noticeText,
      popperClass: 'text-xs',
      disposeTimeout: 2000,
      shown: showNotice,
      triggers: [],
    }"
    class="w-fit"
    @click="copy"
  >
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const props = withDefaults(
  defineProps<{
    text: string;
    noticeText?: string;
  }>(),
  {
    noticeText: "Copied",
  }
);
const showNotice = ref(false);

const copy = async () => {
  await navigator.clipboard.writeText(props.text);
  showHideNotice();
};

const showHideNotice = () => {
  showNotice.value = true;
  setTimeout(() => {
    showNotice.value = false;
  }, 1000);
};
</script>

<style scoped></style>
