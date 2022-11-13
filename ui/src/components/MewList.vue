<template>
  <mew-list-skeleton v-if="loading" />

  <q-list v-else bordered separator>
    <mew-list-item v-for="(mew, index) of mews" :key="index" :feed-mew="mew" />
  </q-list>
</template>

<script setup lang="ts">
import { PropType } from "vue";
import { FeedMew } from "@/types/types";
import MewListItem from "@/components/MewListItem.vue";
import MewListSkeleton from "@/components/MewListSkeleton.vue";

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
</script>
