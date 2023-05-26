<template>
  <h6 v-if="title" class="q-mb-md">{{ title }}</h6>

  <MewListSkeleton v-if="isLoading && !isLoadingMore" />
  <EmptyMewsFeed v-else-if="feedMews && feedMews.length === 0" />
  <QInfiniteScroll
    v-else-if="feedMews && feedMews.length > 0"
    :offset="250"
    @load="loadMoreFn"
  >
    <QList bordered separator class="q-mb-lg">
      <BaseMewListItem
        v-for="(mew, index) of feedMews"
        :key="index"
        :feed-mew="mew"
        v-bind="$attrs"
      />
    </QList>

    <template #loading>
      <div class="row justify-center q-my-md">
        <QSpinnerDots color="primary" size="40px" />
      </div>
    </template>
  </QInfiniteScroll>
</template>

<script setup lang="ts">
import { QList, QSpinnerDots, QInfiniteScroll } from "quasar";
import BaseMewListItem from "@/components/BaseMewListItem.vue";
import MewListSkeleton from "@/components/MewListSkeleton.vue";
import { FeedMew } from "@/types/types";
import EmptyMewsFeed from "@/components/EmptyMewsFeed.vue";

withDefaults(
  defineProps<{
    feedMews?: FeedMew[];
    isLoading: boolean;
    isLoadingMore?: boolean;
    title?: string;
    loadMoreFn?: (i: number, done: (stop: boolean) => void) => Promise<void>;
  }>(),
  {
    loadMoreFn: undefined,
    isLoadingMore: false,
    feedMews: undefined,
    title: undefined,
  }
);
</script>
