<template>
  <QPage class="q-pb-lg" :style-fn="pageHeightCorrection">
    <MewList
      :key="forceReloadMewsList"
      :show-create-mew-field="true"
      :fetch-fn="fetchMewsFeed"
      title="Your Mews Feed"
      :cache-key="`mews/get_followed_creators_mews_with_context/${encodeHashToBase64(
        client.myPubKey
      )}`"
      :insert-responses="true"
    />
  </QPage>
</template>

<script setup lang="ts">
import { QPage } from "quasar";
import { pageHeightCorrection } from "@/utils/page-layout";
import { AppAgentClient, encodeHashToBase64 } from "@holochain/client";
import { ComputedRef, inject, ref } from "vue";
import { FeedMew } from "@/types/types";
import MewList from "@/components/MewList.vue";

const client = (inject("client") as ComputedRef<AppAgentClient>).value;
const forceReloadMewsList = ref(0);

const fetchMewsFeed = (): Promise<FeedMew[]> =>
  client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "get_followed_creators_mews_with_context",
    payload: client.myPubKey,
  });
</script>
