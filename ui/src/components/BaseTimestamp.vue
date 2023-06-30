<template>
  <div class="tooltip tooltip-left xl:tooltip-bottom" :data-tip="timestamp">
    <div>{{ formattedTimestamp }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

const props = defineProps({ timestamp: { type: Number, required: true } });

const timestamp = computed(() => new Date(Number(props.timestamp) / 1000));
const formattedTimestamp = computed(() => dayjs().to(dayjs(timestamp.value)));
</script>
