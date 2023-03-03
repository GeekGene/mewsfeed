<template>
  <mew-list-skeleton v-if="isLoading" />

  <EmptyMewsFeed v-else-if="mews.length === 0" />

  <q-list v-else padding separator>
    <mew-list-item
      v-for="(mew, index) of mews"
      :key="index"
      :feed-mew="mew"
      :on-toggle-lick-mew="onToggleLickMew"
      :on-publish-mew="onPublishMew"
      @click.passive="onMewClick(mew.actionHash)"
    />
  </q-list>
</template>

<script setup lang="ts">
import MewListItem from "@/components/MewListItem.vue";
import MewListSkeleton from "@/components/MewListSkeleton.vue";
import router, { ROUTES } from "@/router";
import { FeedMew, MewType } from "@/types/types";
import { ActionHash, encodeHashToBase64 } from "@holochain/client";
import { PropType } from "vue";
import EmptyMewsFeed from "./EmptyMewsFeed.vue";

defineProps({
  mews: { type: Array as PropType<FeedMew[]>, required: true },
  isLoading: { type: Boolean, required: true },
  onToggleLickMew: {
    type: Function as PropType<(hash: ActionHash) => Promise<void>>,
    required: true,
  },
  onPublishMew: {
    type: Function as PropType<(mewType: MewType) => Promise<void>>,
    required: true,
  },
});

const onMewClick = (actionHash: Uint8Array) => {
  console.log('going!');
  router.push({
    name: ROUTES.yarn,
    params: { hash: encodeHashToBase64(actionHash) },
  });
};
</script>
