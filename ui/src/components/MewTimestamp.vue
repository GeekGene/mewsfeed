<template>
  {{ formattedTimestamp }}
</template>

<script setup lang="ts">
import { computed } from "vue";
import formatDistanceToNow from 'date-fns/formatDistanceToNow';

const props = defineProps({ timestamp: { type: Number, required: true } });

const timestamp = computed(() => new Date(Number(props.timestamp) / 1000));
const formattedTimestamp = computed(
  () => formatDistanceToNow(timestamp.value, {addSuffix: true})
);
</script>
