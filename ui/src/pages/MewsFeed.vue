<template>
  <QPage class="q-pb-lg" :style-fn="pageHeightCorrection">
    <CreateMewField
      :mew-type="{ [MewTypeName.Original]: null }"
      @publish-mew="store.fetchMewsFeed"
    />

    <h6 class="q-mb-md">Your Mews Feed</h6>

    <MewList
      :mews="store.mewsFeed"
      :is-loading="store.isLoadingMewsFeed"
      :on-toggle-lick-mew="onToggleLickMew"
      :on-publish-mew="onPublishMew"
    />
  </QPage>
</template>

<script setup lang="ts">
import CreateMewField from "@/components/CreateMewField.vue";
import MewList from "@/components/MewList.vue";
import { useMewsfeedStore } from "@/stores/mewsfeed";
import { pageHeightCorrection } from "@/utils/page-layout";
import { ActionHash } from "@holochain/client";
import { onMounted } from "vue";
import { MewTypeName } from "@/types/types";

const mewsfeedStore = useMewsfeedStore();
onMounted(mewsfeedStore.fetchMewsFeed);

const onToggleLickMew = (hash: ActionHash) => mewsfeedStore.reloadMew(hash);
const onPublishMew = async () => mewsfeedStore.fetchMewsFeed();
</script>
