<template>
  <q-page
    class="text-center"
    padding
  >
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
            @mouseleave="hideProfile(index)"
          >
            <q-menu
              v-model="profileVisible[index]"
              self="top middle"
              :offset="[0, 5]"
              no-focus
            >
              <q-card
                @mouseenter="keepShowingProfile(index)"
                @mouseleave="hideProfile(index)"
              >
                <q-card-section>{{ mew.header.author }}</q-card-section>
              </q-card>
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
import { createMew, mewsFeed as getMewsFeed } from '../services/clutter-dna';
import { onMounted, ref } from 'vue';
import { FeedMew, Mew } from '../types/types';
import { showError } from '../utils/notification';
import { authorPubKey } from "../utils/hash";
import MewComponent from '../components/Mew.vue';
import MewConstructor from '../components/MewConstructor.vue';

const PROFILE_SHOW_HIDE_DELAY = 400; // in ms

const loading = ref(false);
const mewsFeed = ref<FeedMew[]>([]);
const profileVisible = ref<boolean[]>([]);
const profileHideTimeouts = ref<number[]>([]);
const profileShowTimeouts = ref<number[]>([]);

const loadMewsFeed = async () => {
  try {
    loading.value = true;
    mewsFeed.value = await getMewsFeed({ option: '' });
    profileVisible.value = new Array(mewsFeed.value.length).fill(false);
    profileShowTimeouts.value = new Array(mewsFeed.value.length).fill(0);
    profileHideTimeouts.value = new Array(mewsFeed.value.length).fill(0);
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
  profileShowTimeouts.value[index] = window.setTimeout(
    () => profileVisible.value[index] = true,
    PROFILE_SHOW_HIDE_DELAY
  );
};

const hideProfile = (index: number) => {
  window.clearTimeout(profileShowTimeouts.value[index]);
  profileHideTimeouts.value[index] = window.setTimeout(
    () => profileVisible.value[index] = false,
    PROFILE_SHOW_HIDE_DELAY
  );
};

const keepShowingProfile = (index: number) => {
  window.clearTimeout(profileHideTimeouts.value[index]);
};
</script>