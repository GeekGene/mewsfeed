<template>
  <q-page class="q-pb-lg" :style-fn="pageHeightCorrection">
    <CreateMewField
      :mew-type="{ original: null }"
      @publish-mew="store.fetchMewsFeed"
    />

    <h6 class="q-mb-md">Your Mews Feed</h6>

    <MewList
      :mews="store.mewsFeed"
      :is-loading="store.isLoadingMewsFeed"
      :on-toggle-lick-mew="onToggleLickMew"
      :on-publish-mew="onPublishMew"
    />
  </q-page>
</template>

<script setup lang="ts">
import CreateMewField from "@/components/CreateMewField.vue";
import MewList from "@/components/MewList.vue";
import { useMewsfeedStore } from "@/stores";
import { pageHeightCorrection } from "@/utils/page-layout";
import { ActionHash } from "@holochain/client";
import { onMounted } from "vue";

const store = useMewsfeedStore();
onMounted(store.fetchMewsFeed);

const onToggleLickMew = (hash: ActionHash) => store.reloadMew(hash);
const onPublishMew = async () => store.fetchMewsFeed();
</script>
