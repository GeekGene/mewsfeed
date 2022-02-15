<template>
  <q-page
    padding
  >
    <AddMew
      class="text-center"
      @publish-mew="publishMew"
    />

    <h5 class="q-mb-md">
      Your Mews Feed
    </h5>
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
        <FeedMewWrapper 
          :mew="mew"
          :index="index"
        /> 
      </q-item>
    </q-list>
  </q-page>
</template>

<script setup lang="ts">
import { createMew, mewsFeed as getMewsFeed } from '../services/clutter-dna';
import { onMounted, ref } from 'vue';
import { FeedMewWithContext as FeedMew, CreateMewInput } from '../types/types';
import { showError } from '../utils/notification';
import AddMew from '../components/AddMew.vue';
import FeedMewWrapper from '../components/FeedMewWrapper.vue';


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

const publishMew = async (newMew: CreateMewInput) => {
  await createMew(newMew);
  loadMewsFeed();
};
</script>