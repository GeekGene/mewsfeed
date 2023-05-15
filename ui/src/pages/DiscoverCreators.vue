<template>
  <QPage class="text-center" :style-fn="pageHeightCorrection">
    <MewList
      :fetch-fn="fetchMews"
      title="Discover Mews"
      cache-key="mews/get_random_mews_with_context"
    />
  </QPage>
</template>

<script setup lang="ts">
import { QPage } from "quasar";
import { pageHeightCorrection } from "@/utils/page-layout";
import { ComputedRef, inject } from "vue";
import { AppAgentClient } from "@holochain/client";
import MewList from "@/components/MewList.vue";
import { FeedMew } from "@/types/types";

const client = (inject("client") as ComputedRef<AppAgentClient>).value;

const fetchMews = (): Promise<FeedMew[]> =>
  client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "get_random_mews_with_context",
    payload: 10,
  });
</script>
