<template>
  <q-page class="q-pb-lg">
    <CreateMewField
      class="text-center"
      :mew-type="{ original: null }"
      @publish-mew="publishMew"
    />

    <h6 class="q-mb-md">Your Mews Feed</h6>

    <q-banner
      v-if="!store.isLoadingMewsFeed && store.mewsFeed.length === 0"
      class="bg-grey-3"
      dense
      rounded
    >
      <template #avatar>
        <q-icon name="pets" color="accent" />
      </template>
      <div class="text-subtitle1">Meeoow, nothing here yet!</div>
    </q-banner>

    <MewList
      v-else
      :loading="store.isLoadingMewsFeed"
      :mews="store.mewsFeed"
      @refresh="store.fetchMewsFeed"
    />
  </q-page>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { CreateMewInput } from "../types/types";
import { useClutterStore } from "@/stores";
import CreateMewField from "../components/CreateMewField.vue";
import MewList from "../components/MewList.vue";

const store = useClutterStore();

onMounted(() => store.fetchMewsFeed());

const publishMew = async (newMew: CreateMewInput) => {
  await store.createMew(newMew);
  store.fetchMewsFeed();
};
</script>
