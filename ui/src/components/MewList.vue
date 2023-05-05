<template>
  <MewListSkeleton v-if="isLoading" />

  <EmptyMewsFeed v-else-if="mews.length === 0" />

  <QList v-else bordered separator>
    <mew-list-item
      v-for="(mew, index) of mews"
      :key="index"
      :feed-mew="mew"
      :on-toggle-lick-mew="onToggleLickMew"
      :on-publish-mew="onPublishMew"
    />
  </QList>
</template>

<script setup lang="ts">
import { QList } from "quasar";
import MewListItem from "@/components/MewListItem.vue";
import MewListSkeleton from "@/components/MewListSkeleton.vue";
import { FeedMew, MewType } from "@/types/types";
import EmptyMewsFeed from "./EmptyMewsFeed.vue";
import { ActionHash } from "@holochain/client";

defineProps<{
  mews: FeedMew[];
  isLoading: boolean;
  onToggleLickMew: (a: ActionHash) => Promise<void>;
  onPublishMew: (m: MewType) => Promise<void>;
}>();
</script>
