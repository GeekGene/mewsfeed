<template>
  {{ formattedTimestamp }}
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps({ timestamp: { type: Number, required: true } });

const timestamp = computed(() => new Date(Number(props.timestamp) / 1000));
const dateFormatOptions: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "2-digit",
};
const timeFormatOptions: Intl.DateTimeFormatOptions = {
  hour: "numeric",
  minute: "numeric",
};
const formattedDate = computed(() =>
  new Intl.DateTimeFormat("default", dateFormatOptions).format(timestamp.value)
);
const formattedTime = computed(() =>
  new Intl.DateTimeFormat("default", timeFormatOptions).format(timestamp.value)
);
const formattedTimestamp = computed(
  () => `${formattedTime.value} on ${formattedDate.value}`
);
</script>
