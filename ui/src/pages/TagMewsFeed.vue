<template>
  <q-page :style-fn="pageHeightCorrection">
    <h6 class="q-mt-none q-mb-md">Mews with {{ tagSymbol }}{{ tag }}</h6>

    <MewList
      :mews="mews"
      :is-loading="isLoading"
      :on-toggle-lick-mew="onToggleLickMew"
      :on-publish-mew="onPublishmew"
    />
  </q-page>
</template>

<script setup lang="ts">
import {
  getFeedMewAndContext,
  getMewsWithCashtag,
  getMewsWithHashtag,
  getMewsWithMention,
} from "@/services/mewsfeed-dna";
import { FeedMew, MewType, MewTypeName } from "@/types/types";
import { isSameHash } from "@/utils/hash";
import { showError, showMessage } from "@/utils/notification";
import { pageHeightCorrection } from "@/utils/page-layout";
import { TAG_SYMBOLS } from "@/utils/tags";
import { ActionHash, decodeHashFromBase64 } from "@holochain/client";
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import MewList from "../components/MewList.vue";

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

const mews = ref<FeedMew[]>([]);
const isLoading = ref(false);

const loadMewsFeed = async () => {
  try {
    isLoading.value = true;
    if (tagSymbol.value === TAG_SYMBOLS.CASHTAG) {
      mews.value = await getMewsWithCashtag(tagSymbol.value + tag.value);
    } else if (tagSymbol.value === TAG_SYMBOLS.HASHTAG) {
      mews.value = await getMewsWithHashtag(tagSymbol.value + tag.value);
    } else {
      mews.value = await getMewsWithMention(
        decodeHashFromBase64(agentPubKey.value || "")
      );
    }
  } catch (error) {
    showError(error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(loadMewsFeed);
watch(router.currentRoute, loadMewsFeed);

const onToggleLickMew = async (hash: ActionHash) => {
  try {
    const index = mews.value.findIndex((mew) =>
      isSameHash(hash, mew.actionHash)
    );
    if (index !== -1) {
      mews.value[index] = await getFeedMewAndContext(hash);
    }
  } catch (error) {
    showError(error);
  }
};

const onPublishmew = async (mewType: MewType) => {
  loadMewsFeed();
  showMessage(
    MewTypeName.Reply in mewType
      ? "Replied to mew"
      : MewTypeName.MewMew in mewType
      ? "Mew mewmewed"
      : "Quoted mew"
  );
};
</script>
