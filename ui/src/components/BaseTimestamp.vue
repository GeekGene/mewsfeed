<template>
  <div
    v-tooltip.bottom="{
      content: timestamp.toString(),
      popperClass: 'text-xs font-mono',
      triggers: ['hover'],
    }"
    class="font-mono inline-block"
  >
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
