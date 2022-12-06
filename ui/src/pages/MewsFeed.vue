<template>
  <q-page class="q-pb-lg" :style-fn="pageHeightCorrection">
    <CreateMewField
      :mew-type="{ original: null }"
      @publish-mew="store.fetchMewsFeed"
    />

    <h6 class="q-mb-md">Your Mews Feed</h6>

    <EmptyMewsFeed
      v-if="!store.isLoadingMewsFeed && store.mewsFeed.length === 0"
    />

    <MewList
      v-else
      :mews="store.mewsFeed"
      :is-loading="store.isLoadingMewsFeed"
    />
  </q-page>
</template>

<script setup lang="ts">
import { useClutterStore } from "@/stores";
import { pageHeightCorrection } from "@/utils/page-layout";
import { onMounted } from "vue";
import CreateMewField from "@/components/CreateMewField.vue";
import MewList from "@/components/MewList.vue";
import EmptyMewsFeed from "@/components/EmptyMewsFeed.vue";

const store = useClutterStore();
onMounted(store.fetchMewsFeed);
</script>
