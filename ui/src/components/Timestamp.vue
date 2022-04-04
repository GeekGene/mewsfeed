<template>
  {{ formattedTimestamp }}
</template>

<script setup lang="ts">
const props = defineProps({ timestamp: { type: Number, required: true } });

const timestamp = new Date(Number(props.timestamp) / 1000);
const dateFormatOptions: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "2-digit",
};
const timeFormatOptions: Intl.DateTimeFormatOptions = {
  hour: "numeric",
  minute: "numeric",
};
const formattedDate = new Intl.DateTimeFormat(
  "default",
  dateFormatOptions
).format(timestamp);
const formattedTime = new Intl.DateTimeFormat(
  "default",
  timeFormatOptions
).format(timestamp);
const formattedTimestamp = `${formattedTime} on ${formattedDate}`;
</script>
