<template>
  <mew-list-skeleton v-if="store.isLoadingMewsFeed" />

  <q-list v-else bordered separator>
    <mew-list-item
      v-for="(mew, index) of store.mewsFeed"
      :key="index"
      :feed-mew="mew"
    />
  </q-list>
</template>

<script setup lang="ts">
import MewListItem from "@/components/MewListItem.vue";
import MewListSkeleton from "@/components/MewListSkeleton.vue";
import { useClutterStore } from "@/stores";

const store = useClutterStore();
</script>
