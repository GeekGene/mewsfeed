<template>
  <MewListSkeleton v-if="isLoading" />

  <EmptyMewsFeed v-else-if="mews.length === 0" />

  <QList v-else bordered separator>
    <MewListItem
      v-for="(mew, index) of mews"
      :key="index"
      :feed-mew="mew"
      v-bind="$attrs"
    />
  </QList>
</template>

<script setup lang="ts">
import { QList } from "quasar";
import MewListItem from "@/components/MewListItem.vue";
import MewListSkeleton from "@/components/MewListSkeleton.vue";
import { FeedMew } from "@/types/types";
import EmptyMewsFeed from "./EmptyMewsFeed.vue";

defineProps<{
  mews: FeedMew[];
  isLoading: boolean;
}>();
</script>
