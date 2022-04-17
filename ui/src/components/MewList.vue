<template>
  <FeedItemSkeleton v-if="loading" />

  <q-list v-else bordered separator>
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
import FeedItemSkeleton from "@/components/FeedItemSkeleton.vue";

defineProps({
  mews: {
    required: true,
    type: Object as PropType<FeedMew[]>,
  },
  loading: {
    default: false,
    type: Boolean,
  },
});

const emit = defineEmits<{ (e: "refresh"): void }>();
</script>
