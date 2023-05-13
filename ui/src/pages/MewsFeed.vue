<template>
  <QPage class="q-pb-lg" :style-fn="pageHeightCorrection">
    <CreateMewField
      :mew-type="{ [MewTypeName.Original]: null }"
      @publish-mew="() => mewsfeedStore.fetchMewsFeed(client)"
    />

    <h6 class="q-mb-md">Your Mews Feed</h6>

    <MewList
      :mews="mewsfeedStore.mewsFeed"
      :is-loading="mewsfeedStore.isLoadingMewsFeed"
      @toggle-lick-mew="onToggleLickMew"
      @publish-mew="onPublishMew"
    />
  </QPage>
</template>

<script setup lang="ts">
import { QPage } from "quasar";
import CreateMewField from "@/components/CreateMewField.vue";
import MewList from "@/components/MewList.vue";
import { useMewsfeedStore } from "@/stores/mewsfeed";
import { pageHeightCorrection } from "@/utils/page-layout";
import { ActionHash, AppAgentClient } from "@holochain/client";
import { ComputedRef, inject, onMounted } from "vue";
import { MewTypeName } from "@/types/types";

const client = (inject("client") as ComputedRef<AppAgentClient>).value;
const mewsfeedStore = useMewsfeedStore();
onMounted(() => {
  mewsfeedStore.fetchMewsFeed(client);
});

const onToggleLickMew = (hash: ActionHash) =>
  mewsfeedStore.reloadMew(client, hash);
const onPublishMew = async () => mewsfeedStore.fetchMewsFeed(client);
</script>
