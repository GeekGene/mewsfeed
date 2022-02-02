<template>
  <div class="q-pb-xl">
    <MewConstructor @publish-mew="publishMew" />
    <h4>Your Mews Feed:</h4>
    <q-spinner-pie
      v-if="loading"
      size="10%"
      color="primary"
    />
    <q-list
      v-else
      bordered
      separator
    >
      <q-item
        v-for="(mew, index) in mewsFeed"
        :key="index"
      >
        <q-item-section avatar>
          <agent-avatar
            :agent-pub-key="authorPubKey(mew.header.author)"
            size="50"
          />
        </q-item-section>
        <q-item-section class="text-body1 text-left">
          <MewComponent :mew-content="mew" />
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script setup lang="ts">
import { serializeHash } from '@holochain-open-dev/core-types';
import { createMew, mewsFeed as getMewsFeed } from '../services/clutter-dna';
import { onMounted, ref } from 'vue';
import { FeedMew, Mew } from '../types/types';
import { showError } from '../utils/notification';
import MewComponent from '../components/Mew.vue';
import MewConstructor from '../components/MewConstructor.vue';

const loading = ref(false);
const mewsFeed = ref<FeedMew[]>([]);

const loadMewsFeed = async () => {
  try {
    loading.value = true;
    mewsFeed.value = await getMewsFeed({ option: '' });
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

const authorPubKey = (author: unknown) => {
  if (author instanceof Uint8Array) {
    return serializeHash(author);
  }
};
</script>