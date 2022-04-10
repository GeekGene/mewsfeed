<template>
  <q-page padding>
    <h6 class="q-mt-none q-mb-md">Mews with {{ tagSymbol }}{{ tag }}</h6>
    <FeedSkeleton v-if="loading" />

    <q-list v-else bordered separator>
      <q-item v-for="(mew, index) in mews" :key="index" class="items-start">
        <FeedMew
          :mew="mew"
          :index="index"
          @publish-mew="publishMew"
          @refresh-feed="loadMewsFeed"
        />
      </q-item>
    </q-list>
  </q-page>
</template>

<script setup lang="ts">
import {
  createMew,
  getMewsWithCashtag,
  getMewsWithHashtag,
  getMewsWithMention,
} from "@/services/clutter-dna";
import { onMounted, computed, ref, watch } from "vue";
import { FeedMewWithContext, CreateMewInput, TAG_SYMBOLS } from "@/types/types";
import { showError } from "@/utils/notification";
import { useRouter } from "vue-router";
import FeedMew from "@/components/FeedMew.vue";
import FeedSkeleton from "@/components/FeedSkeleton.vue";

const router = useRouter();
const currentRoute = computed(() => router.currentRoute.value);
const tagSymbol = computed(() => currentRoute.value.meta.tag);
const tag = computed(() =>
  Array.isArray(currentRoute.value.params.tag)
    ? currentRoute.value.params.tag[0]
    : currentRoute.value.params.tag
);

const loading = ref(false);
const mews = ref<FeedMewWithContext[]>([]);

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

const publishMew = async (newMew: CreateMewInput) => {
  await createMew(newMew);
  loadMewsFeed();
};
</script>
