<template>
  <h6 v-if="title" class="q-mb-md">{{ title }}</h6>

  <QList
    v-if="feedMews && feedMews.length > 0"
    bordered
    separator
    class="q-mb-lg"
  >
    <BaseMewListItem
      v-for="(mew, index) of feedMews"
      :key="index"
      :feed-mew="mew"
      v-bind="$attrs"
    />
  </QList>
  <MewListSkeleton v-else-if="isLoading" />
  <EmptyMewsFeed v-else />
</template>

<script setup lang="ts">
import { QList } from "quasar";
import BaseMewListItem from "@/components/BaseMewListItem.vue";
import MewListSkeleton from "@/components/MewListSkeleton.vue";
import { FeedMew } from "@/types/types";
import EmptyMewsFeed from "@/components/EmptyMewsFeed.vue";

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
