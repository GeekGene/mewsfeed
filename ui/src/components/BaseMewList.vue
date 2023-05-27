<template>
  <h6 v-if="title" class="q-mb-md">{{ title }}</h6>

  <MewListSkeleton v-if="isLoading || !feedMews" />
  <BaseEmptyMewsFeed v-else-if="feedMews && !isLoading && feedMews.length === 0" />
  <QList v-else bordered separator>
    <BaseMewListItem
      v-for="(mew, index) of feedMews"
      :key="index"
      :feed-mew="mew"
      v-bind="$attrs"
    />
  </QList>
</template>

<script setup lang="ts">
import { QList } from "quasar";
import BaseMewListItem from "@/components/BaseMewListItem.vue";
import MewListSkeleton from "@/components/MewListSkeleton.vue";
import { FeedMew } from "@/types/types";
import BaseEmptyMewsFeed from "./BaseEmptyMewsFeed.vue";

withDefaults(
  defineProps<{
    feedMews?: FeedMew[];
    isLoading: boolean;
    title?: string;
  }>(),
  {
    feedMews: undefined,
    title: undefined,
  }
);
</script>
