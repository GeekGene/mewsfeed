<template>
  <div class="column">
    <div class="text-body1">
      {{ mewContent.mew.mewType.original.mew }}
    </div>
    <div class="self-end text-caption">
      {{ formattedTimestamp }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { FeedMew } from "@/types/types";
import { PropType } from "vue";
const props = defineProps({ mewContent: { type: Object as PropType<FeedMew>, required: true } });

const timestamp = new Date(Number(props.mewContent.header.timestamp) / 1000);
const dateFormatOptions: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "2-digit"};
const timeFormatOptions: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "numeric" };
const formattedDate = new Intl.DateTimeFormat("default", dateFormatOptions).format(timestamp);
const formattedTime = new Intl.DateTimeFormat("default", timeFormatOptions).format(timestamp);
const formattedTimestamp = `${formattedTime} on ${formattedDate}`;
</script>
