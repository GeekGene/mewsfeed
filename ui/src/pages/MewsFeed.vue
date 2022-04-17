<template>
  <q-page padding>
    <AddMew
      class="text-center"
      :mew-type="{ original: null }"
      @publish-mew="publishMew"
    />

    <h6 class="q-mb-md">Your Mews Feed</h6>

    <FeedItemSkeleton v-if="loading" />

    <q-banner v-else-if="mews.length === 0" class="bg-grey-3" dense rounded>
      <template #avatar>
        <q-icon name="pets" color="accent" />
      </template>
      <div class="text-subtitle1">Meeoow, nothing here yet!</div>
    </q-banner>

    <MewList v-else :mews="mews" @refresh="loadMewsFeed" />
  </q-page>
</template>

<script setup lang="ts">
import { createMew, mewsFeed as getMewsFeed } from "../services/clutter-dna";
import { onMounted, ref } from "vue";
import { FeedMew, CreateMewInput } from "../types/types";
import { showError } from "../utils/notification";
import AddMew from "../components/AddMew.vue";
import MewList from "../components/MewList.vue";
import FeedItemSkeleton from "../components/FeedItemSkeleton.vue";

const loading = ref(false);
const mews = ref<FeedMew[]>([]);

const loadMewsFeed = async () => {
  try {
    loading.value = true;
    mews.value = await getMewsFeed({ option: "" });
  } catch (error) {
    showError(error);
  } finally {
    loading.value = false;
  }
};

onMounted(loadMewsFeed);

const publishMew = async (newMew: CreateMewInput) => {
  await createMew(newMew);
  loadMewsFeed();
};
</script>
