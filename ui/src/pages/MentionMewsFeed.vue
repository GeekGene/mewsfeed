<template>
  <QPage :style-fn="pageHeightCorrection">
    <MewList
      :fetch-fn="fetchMentionMews"
      :title="`Mews with ${route.meta.tag}${route.params.tag}`"
      :cache-key="`mews/get_mews_for_mention_with_context/${decodeHashFromBase64(route.params.agentPubKey as string)}`"
    />
  </QPage>
</template>

<script setup lang="ts">
import { QPage } from "quasar";
import { pageHeightCorrection } from "@/utils/page-layout";
import { AppAgentClient, decodeHashFromBase64 } from "@holochain/client";
import { ComputedRef, inject } from "vue";
import { useRoute } from "vue-router";
import MewList from "@/components/MewList.vue";

const route = useRoute();
const client = (inject("client") as ComputedRef<AppAgentClient>).value;

const fetchMentionMews = () =>
  client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "get_mews_for_mention_with_context",
    payload: decodeHashFromBase64(route.params.agentPubKey as string),
  });
</script>
