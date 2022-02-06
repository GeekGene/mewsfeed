<template>
  <q-page
    padding
  >
    <AddMew
      class="text-center"
      @publish-mew="publishMew"
    />

    <h4 class="q-mb-md">
      Your Mews Feed
    </h4>
    <q-list v-if="loading">
      <q-item
        v-for="i in [0, 1, 2]"
        :key="i"
      >
        <q-item-section avatar>
          <q-skeleton type="circle" />
        </q-item-section>
        <q-item-section>
          <q-skeleton
            type="text"
            class="q-mb-xs"
          />
          <q-skeleton type="text" />
        </q-item-section>
      </q-item>
    </q-list>

    <q-banner
      v-else-if="mewsFeed.length === 0"
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
              <ProfilePopup
                :author="mew.header.author"
                @mouseenter="keepShowingProfile(index)"
                @mouseleave="hideProfile(index)"
              />
            </q-menu>
          </agent-avatar>
        </q-item-section>
        <q-item-section>
          <MewsFeedContent :mew-content="mew" />
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
import AddMew from '../components/AddMew.vue';
import MewsFeedContent from '../components/MewsFeedContent.vue';
import ProfilePopup from "../components/ProfilePopup.vue";

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