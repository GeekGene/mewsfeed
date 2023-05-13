<template>
  <h6 v-if="title" class="q-mb-md">{{ title }}</h6>

  <MewListSkeleton v-if="isLoading" />
  <EmptyMewsFeed v-else-if="!isLoading && feedMews.length === 0" />
  <QList v-else bordered separator>
    <MewListItem
      v-for="(mew, index) of feedMews"
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

withDefaults(
  defineProps<{
    feedMews: FeedMew[];
    isLoading: boolean;
    title?: string;
  }>(),
  {
    title: undefined,
  }
);
</script>
