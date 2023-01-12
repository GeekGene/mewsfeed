<template>
  <q-page class="text-center" :style-fn="pageHeightCorrection">
    <h6>Meeow, you're in!</h6>
    <h2>Welcome to the Clutter</h2>
    <q-img
      v-if="store.mostLickedMewsFeed?.length === 0"
      width="40%"
      src="@/assets/img/cat-eating-bird-circle.png"
    />
    <div v-else>
      <h5 class="q-mb-md">👅 Most Licked Mews 👅</h5>
      <MewList
        :mews="store.mostLickedMewsFeed"
        :is-loading="store.isLoadingMostLickedMewsFeed"
        :on-toggle-lick-mew="onToggleLickMew"
        :on-publish-mew="onPublishMew"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { pageHeightCorrection } from "@/utils/page-layout";
import { useClutterStore } from "@/stores";
import { onMounted } from "vue";
import { ActionHash } from "@holochain/client";
import MewList from "@/components/MewList.vue";

const store = useClutterStore();
onMounted(() => {
  store.fetchMostLickedMewsFeed(5);
});

const onToggleLickMew = (hash: ActionHash) => store.reloadMew(hash);
const onPublishMew = async () => store.fetchMewsFeed();
</script>
