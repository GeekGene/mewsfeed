<template>
  <q-list bordered separator>
    <q-item v-for="(mew, index) of mews" :key="index" class="items-start">
      <FeedItem
        :feed-mew="mew"
        :index="index"
        @refresh-feed="emit('refresh')"
      />
    </q-item>
  </q-list>
</template>

<script setup lang="ts">
import { PropType } from "vue";
import { FeedMew } from "@/types/types";
import FeedItem from "./FeedItem.vue";

defineProps({
  mews: {
    required: true,
    type: Object as PropType<FeedMew[]>,
  },
});

const emit = defineEmits<{ (e: "refresh"): void }>();
</script>
