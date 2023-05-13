<template>
  <QPage :style-fn="pageHeightCorrection">
    <MewList
      :fetch-fn="fetchHashtagMews"
      :title="`Mews with ${route.meta.tag}${route.params.tag}`"
      :cache-key="`mews/get_mews_for_hashtag_with_context/${route.meta.tag}${route.params.tag}`"
    />
  </QPage>
</template>

<script setup lang="ts">
import { QPage } from "quasar";
import { pageHeightCorrection } from "@/utils/page-layout";
import { AppAgentClient } from "@holochain/client";
import { ComputedRef, inject } from "vue";
import { useRoute } from "vue-router";
import MewList from "@/components/MewList.vue";

const route = useRoute();
const client = (inject("client") as ComputedRef<AppAgentClient>).value;

const fetchHashtagMews = () =>
  client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "get_mews_for_hashtag_with_context",
    payload: `${route.meta.tag}${route.params.tag}`,
  });
</script>
