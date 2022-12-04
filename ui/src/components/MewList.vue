<template>
  <mew-list-skeleton v-if="isLoading" />

  <q-list v-else bordered separator>
    <mew-list-item v-for="(mew, index) of mews" :key="index" :feed-mew="mew" />
  </q-list>
</template>

<script setup lang="ts">
import MewListItem from "@/components/MewListItem.vue";
import MewListSkeleton from "@/components/MewListSkeleton.vue";
import { FeedMew } from "@/types/types";
import { PropType } from "vue";

defineProps({
  mews: { type: Array as PropType<FeedMew[]>, required: true },
  isLoading: { type: Boolean, required: true },
});
</script>
