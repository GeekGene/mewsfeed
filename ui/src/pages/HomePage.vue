<template>
  <q-page class="text-center" :style-fn="pageHeightCorrection">
    <h6>Meeow, you're in!</h6>
    <div v-if="store.mostLickedMewsToday?.length === 0">
      <h2>Welcome to the Clutter</h2>
      <q-img width="40%" src="@/assets/img/cat-eating-bird-circle.png" />
    </div>
    <div v-else>
      <h5 class="q-mb-xl">Most Licked Mews 👅</h5>
      <q-tabs
        v-model="tabSelected"
        narrow-indicator
        dense
        align="justify"
        class="text-primary q-mb-lg m-a-none p-a-none"
      >
        <q-tab :ripple="false" name="today" label="Today" />
        <q-tab :ripple="false" name="this_week" label="This Week" />
        <q-tab :ripple="false" name="this_month" label="This Month" />
        <q-tab :ripple="false" name="this_year" label="This Year" />
      </q-tabs>

      <MewList
        v-if="tabSelected === 'today'"
        :mews="store.mostLickedMewsToday"
        :is-loading="store.isLoadingMostLickedMewsRecently"
        :on-toggle-lick-mew="onToggleLickMew"
        :on-publish-mew="onPublishMew"
      />
      <MewList
        v-else-if="tabSelected === 'this_week'"
        :mews="store.mostLickedMewsThisWeek"
        :is-loading="store.isLoadingMostLickedMewsRecently"
        :on-toggle-lick-mew="onToggleLickMew"
        :on-publish-mew="onPublishMew"
      />
      <MewList
        v-else-if="tabSelected === 'this_month'"
        :mews="store.mostLickedMewsThisMonth"
        :is-loading="store.isLoadingMostLickedMewsRecently"
        :on-toggle-lick-mew="onToggleLickMew"
        :on-publish-mew="onPublishMew"
      />
      <MewList
        v-else-if="tabSelected === 'this_year'"
        :mews="store.mostLickedMewsThisYear"
        :is-loading="store.isLoadingMostLickedMewsRecently"
        :on-toggle-lick-mew="onToggleLickMew"
        :on-publish-mew="onPublishMew"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { pageHeightCorrection } from "@/utils/page-layout";
import { useClutterStore } from "@/stores";
import { onMounted, onUpdated, ref } from "vue";
import { ActionHash } from "@holochain/client";
import MewList from "@/components/MewList.vue";

const store = useClutterStore();
const tabSelected = ref<string>("this_week");

onMounted(() => {
  store.fetchMostLickedMewsRecently();
});
onUpdated(() => {
  store.fetchMostLickedMewsRecently();
});

const onToggleLickMew = async (hash: ActionHash) => {
  console.log("licked");
  store.reloadMew(hash);
};
const onPublishMew = async () => {
  console.log("published");
  store.fetchMostLickedMewsRecently();
};
</script>
