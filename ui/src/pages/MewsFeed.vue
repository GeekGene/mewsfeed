<template>
  <q-page padding>
    <MewConstructor @publish-mew="publishMew" />
    <h4>Your Mews Feed</h4>
    <q-spinner-pie
      v-if="loading"
      size="10%"
      color="primary"
    />

    <div
      v-else-if="mewsFeed.length === 0"
      class="text-subtitle1"
    >
      Meeoow, nothing here yet!
    </div>

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
            class="cursor-pointer"
            @mouseenter="showProfile(index)"
          >
            <q-menu
              v-model="profileVisible[index]"
              anchor="bottom left"
              :offset="[40, 20]"
            >
              <q-banner>
                <template #avatar>
                  <q-icon
                    name="signal_wifi_off"
                    color="primary"
                  />
                </template>
                You have lost connection to the internet. This app is offline.
              </q-banner>
            </q-menu>
          </agent-avatar>
        </q-item-section>
        <q-item-section class="text-body1 text-left">
          <MewComponent :mew-content="mew" />
        </q-item-section>
      </q-item>
    </q-list>
  </q-page>
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
const profileVisible = ref<boolean[]>([]);

const loadMewsFeed = async () => {
  try {
    loading.value = true;
    mewsFeed.value = await getMewsFeed({ option: '' });
    profileVisible.value = new Array(mewsFeed.value.length).fill(false);
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

const showProfile = (index: number) => {
  profileVisible.value = new Array(mewsFeed.value.length).fill(false);
  profileVisible.value[index] = true;
};

const authorPubKey = (author: unknown) => {
  if (author instanceof Uint8Array) {
    return serializeHash(author);
  }
};
</script>