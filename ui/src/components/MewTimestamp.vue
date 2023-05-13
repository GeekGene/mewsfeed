<template>
  {{ formattedTimestamp }}
  <QTooltip>{{ timestamp }}</QTooltip>
</template>

<script setup lang="ts">
import { computed } from "vue";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { QTooltip } from "quasar";
dayjs.extend(relativeTime);

const props = defineProps({ timestamp: { type: Number, required: true } });

const timestamp = computed(() => new Date(Number(props.timestamp) / 1000));
const formattedTimestamp = computed(() => dayjs().to(dayjs(timestamp.value)));
</script>
