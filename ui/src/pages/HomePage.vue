<template>
  <q-page class="text-center" :style-fn="pageHeightCorrection">
    <div v-if="hasTopMewsLists">
      <h6 class="q-mb-none q-mt-none">Meeow, you're in!</h6>
      <h2 class="q-mt-sm">Welcome to the Clutter</h2>
      <TopMewsList />
    </div>
    <div v-else>
      <h6>Meeow, you're in!</h6>
      <h2>Welcome to the Clutter</h2>
      <q-img width="40%" src="@/assets/img/cat-eating-bird-circle.png" />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useClutterStore } from "@/stores";
import { pageHeightCorrection } from "@/utils/page-layout";
import { computed, onMounted } from "vue";
import TopMewsList from "@/components/TopMewsList.vue";

const store = useClutterStore();

onMounted(() => {
  store.fetchTopMews("licks");
  store.fetchTopMews("replies");
  store.fetchTopMews("mewmews");
  store.fetchTopMews("quotes");
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
