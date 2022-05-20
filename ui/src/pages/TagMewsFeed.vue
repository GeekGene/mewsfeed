<template>
  <q-page>
    <h6 class="q-mt-none q-mb-md">Mews with {{ tagSymbol }}{{ tag }}</h6>

    <MewList :loading="loading" :mews="mews" @refresh="loadMewsFeed" />
  </q-page>
</template>

<script setup lang="ts">
import {
  getMewsWithCashtag,
  getMewsWithHashtag,
  getMewsWithMention,
} from "@/services/clutter-dna";
import { onMounted, computed, ref, watch } from "vue";
import { FeedMew, TAG_SYMBOLS } from "@/types/types";
import { showError } from "@/utils/notification";
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

const loading = ref(false);
const mews = ref<FeedMew[]>([]);

const loadMewsFeed = async () => {
  try {
    loading.value = true;
    if (tagSymbol.value === TAG_SYMBOLS.CASHTAG) {
      mews.value = await getMewsWithCashtag(tagSymbol.value + tag.value);
    } else if (tagSymbol.value === TAG_SYMBOLS.HASHTAG) {
      mews.value = await getMewsWithHashtag(tagSymbol.value + tag.value);
    } else if (tagSymbol.value === TAG_SYMBOLS.MENTION) {
      mews.value = await getMewsWithMention(tagSymbol.value + tag.value);
    }
  } catch (error) {
    showError(error);
  } finally {
    loading.value = false;
  }
};

onMounted(loadMewsFeed);
watch(router.currentRoute, loadMewsFeed);
</script>
