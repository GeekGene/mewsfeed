<template>
  <div
    class="q-mx-auto"
    style="width: 50%;"
  >
    <MewConstructor @publish-mew="publishMew" />
    <h3>Your Mews Feed:</h3>
    <q-spinner-pie
      v-if="loading"
      size="10%"
      color="primary"
    />
    <q-list
      v-else
      bordered
      separator
      dense
    >
      <q-item
        v-for="(mew, index) in mewsFeed"
        :key="index"
      >
        <q-item-section>
          <MewComponent :mew-content="mew" />
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script setup lang="ts">
import { mewsBy, createMew } from '../services/clutter-dna';
import { useProfileStore } from "../services/profile-store";
import MewComponent from '../components/Mew.vue';
import MewConstructor from '../components/MewConstructor.vue';
import { onMounted, ref } from 'vue';
import { FeedMew, Mew } from '../types/types';
import { showError } from '../utils/notification';

const { myAgentPubKey } = useProfileStore();
const loading = ref(false);
const mewsFeed = ref<FeedMew[]>([]);

const loadMewsFeed = async () => {
  try {
    loading.value = true;
    mewsFeed.value = await mewsBy(myAgentPubKey);
  } catch (error) {
    showError(error);
  } finally {
    loading.value = false;
  }
};

onMounted(loadMewsFeed);

const publishMew = async (newMew: Mew) => {
  await createMew(newMew);
  loadMewsFeed();
};
</script>