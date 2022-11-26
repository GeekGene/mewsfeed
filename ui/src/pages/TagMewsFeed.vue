<template>
  <q-page :style-fn="pageHeightCorrection">
    <h6 class="q-mt-none q-mb-md">Mews with {{ tagSymbol }}{{ tag }}</h6>

    <MewList />
  </q-page>
</template>

<script setup lang="ts">
import {
  getMewsWithCashtag,
  getMewsWithHashtag,
  getMewsWithMention,
} from "@/services/clutter-dna";
import { onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import MewList from "../components/MewList.vue";
import { deserializeHash } from "@holochain-open-dev/utils";
import { TAG_SYMBOLS } from "@/utils/tags";
import { useClutterStore } from "@/stores";
import { pageHeightCorrection } from "@/utils/page-layout";

const store = useClutterStore();
const router = useRouter();
const currentRoute = computed(() => router.currentRoute.value);
const tagSymbol = computed(() => currentRoute.value.meta.tag);
const tag = computed(() =>
  Array.isArray(currentRoute.value.params.tag)
    ? currentRoute.value.params.tag[0]
    : currentRoute.value.params.tag
);
const agentPubKey = computed(() =>
  Array.isArray(currentRoute.value.query.agentPubKey)
    ? currentRoute.value.query.agentPubKey[0]
    : currentRoute.value.query.agentPubKey
);

const loadMewsFeed = async () => {
  if (tagSymbol.value === TAG_SYMBOLS.CASHTAG) {
    return getMewsWithCashtag(tagSymbol.value + tag.value);
  } else if (tagSymbol.value === TAG_SYMBOLS.HASHTAG) {
    return getMewsWithHashtag(tagSymbol.value + tag.value);
  } else {
    return getMewsWithMention(deserializeHash(agentPubKey.value || ""));
  }
};

store.mewsFetcher = loadMewsFeed;

onMounted(store.fetchMewsFeed);
watch(router.currentRoute, loadMewsFeed);
</script>
