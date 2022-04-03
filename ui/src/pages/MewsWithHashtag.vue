<template>
  <q-page padding>
    <h6 class="q-mb-md">
      Mews that contain hashtag #{{ tag }}
    </h6>
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
      v-else-if="matchingMews.length === 0"
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
        Meeoow, nothing found!
      </div>
    </q-banner>

    <q-list
      v-else
      bordered
      separator
    >
      <q-item
        v-for="(mew, index) in matchingMews"
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
import { createMew, getMewsWithHashtag } from '../services/clutter-dna';
import { onMounted, ref } from 'vue';
import { FeedMewWithContext, CreateMewInput } from '../types/types';
import { showError } from '../utils/notification';
import { useRouter } from 'vue-router';
import FeedMew from '../components/FeedMew.vue';

const router = useRouter();
const tag = Array.isArray(router.currentRoute.value.params.tag) ? router.currentRoute.value.params.tag[0] : router.currentRoute.value.params.tag;

let firstLoad = true;
const loading = ref(false);
const matchingMews = ref<FeedMewWithContext[]>([]);
const profileVisible = ref<boolean[]>([]);
const profileHideTimeouts = ref<number[]>([]);
const profileShowTimeouts = ref<number[]>([]);

const loadMewsFeed = async () => {
  try {
    loading.value = firstLoad;
    matchingMews.value = await getMewsWithHashtag('#' + tag);
    profileVisible.value = new Array(matchingMews.value.length).fill(false);
    profileShowTimeouts.value = new Array(matchingMews.value.length).fill(0);
    profileHideTimeouts.value = new Array(matchingMews.value.length).fill(0);
    firstLoad = false;
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