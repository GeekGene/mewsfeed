<template>
  <mew-list-skeleton v-if="isLoading" />

  <EmptyMewsFeed v-else-if="mews.length === 0" />

  <q-list v-else bordered separator>
    <mew-list-item
      v-for="(mew, index) of mews"
      :key="index"
      :feed-mew="mew"
      :on-toggle-lick-mew="onToggleLickMew"
    />
  </q-list>
</template>

<script setup lang="ts">
import MewListItem from "@/components/MewListItem.vue";
import MewListSkeleton from "@/components/MewListSkeleton.vue";
import { FeedMew } from "@/types/types";
import { ActionHash } from "@holochain/client";
import { PropType } from "vue";
import EmptyMewsFeed from "./EmptyMewsFeed.vue";

defineProps({
  mews: { type: Array as PropType<FeedMew[]>, required: true },
  isLoading: { type: Boolean, required: true },
  onToggleLickMew: {
    type: Function as PropType<(hash: ActionHash) => Promise<void>>,
    default: () => ({}),
  },
});
</script>
