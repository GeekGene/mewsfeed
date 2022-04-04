<template>
  <q-page padding>
    <AddMew
      class="text-center"
      :mew-type="{ original: null }"
      @publish-mew="publishMew"
    />

    <h6 class="q-mb-md">
      Your Mews Feed
    </h6>

    <FeedSkeleton v-if="loading" />

    <q-banner
      v-else-if="mews.length === 0"
      class="bg-grey-3"
      dense
      rounded
    >
      <template #avatar>
        <q-icon
          name="pets"
          color="accent"
        />
      </template>
      <div class="text-subtitle1">
        Meeoow, nothing here yet!
      </div>
    </q-banner>

    <q-list
      v-else
      bordered
      separator
    >
      <q-item
        v-for="(mew, index) of mews"
        :key="index"
        class="items-start"
      >
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
import { createMew, mewsFeed as getMewsFeed } from '../services/clutter-dna';
import { onMounted, ref } from 'vue';
import { FeedMewWithContext, CreateMewInput } from '../types/types';
import { showError } from '../utils/notification';
import AddMew from '../components/AddMew.vue';
import FeedMew from '../components/FeedMew.vue';
import FeedSkeleton from '../components/FeedSkeleton.vue';

const loading = ref(false);
const mews = ref<FeedMewWithContext[]>([]);

const loadMewsFeed = async () => {
  try {
    loading.value = true;
    mews.value = await getMewsFeed({ option: '' });
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