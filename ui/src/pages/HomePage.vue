<template>
  <q-page class="text-center" :style-fn="pageHeightCorrection">
    <h6 class="q-mb-none q-mt-none">Meeow, you're in!</h6>
    <h2 class="q-mt-sm">Welcome to the Clutter</h2>
    <q-spinner-pie
      v-if="loading"
      color="secondary"
      size="md"
      class="q-mx-lg q-my-xs"
    />
    <TopMewsList v-else-if="hasTopMewsLists" />
    <q-img v-else width="40%" src="@/assets/img/cat-eating-bird-circle.png" />
  </q-page>
</template>

<script setup lang="ts">
import { useClutterStore } from "@/stores";
import { pageHeightCorrection } from "@/utils/page-layout";
import { computed, onMounted, ref } from "vue";
import TopMewsList from "@/components/TopMewsList.vue";

const store = useClutterStore();
const loading = ref<boolean>(true);

onMounted(async () => {
  await store.fetchTopMews("licks");
  await store.fetchTopMews("replies");
  await store.fetchTopMews("mewmews");
  await store.fetchTopMews("quotes");

  loading.value = false;
});

const hasTopMewsLists = computed(() => {
  return (
    store.topMewsAh["licks"]["year"]?.length > 0 ||
    store.topMewsAh["replies"]["year"]?.length > 0 ||
    store.topMewsAh["mewmews"]["year"]?.length > 0 ||
    store.topMewsAh["quotes"]["year"]?.length > 0
  );
});
</script>
