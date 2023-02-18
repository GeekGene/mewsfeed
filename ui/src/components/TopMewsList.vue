<template>
  <q-tabs
    v-model="tabSelected"
    narrow-indicator
    dense
    align="justify"
    class="text-primary q-mb-lg m-a-none p-a-none"
  >
    <q-tab :ripple="false" name="day" label="Today" />
    <q-tab :ripple="false" name="week" label="This Week" />
    <q-tab :ripple="false" name="month" label="This Month" />
    <q-tab :ripple="false" name="year" label="This Year" />
  </q-tabs>

  <h6 class="q-mb-sm">
    Most Licks <q-icon name="svguse:/icons.svg#lick" color="pink-4" />
  </h6>
  <MewList
    class="q-mb-xl"
    :mews="store.topMewsList('licks', tabSelected)"
    :is-loading="store.isLoadingTop['licks']"
    :on-toggle-lick-mew="onToggleLickMew"
  />
  <h6 class="q-mb-sm">Most Replies <q-icon size="sm" name="reply" flat /></h6>
  <MewList
    class="q-mb-xl"
    :mews="store.topMewsList('replies', tabSelected)"
    :is-loading="store.isLoadingTop['replies']"
    :on-toggle-lick-mew="onToggleLickMew"
  />

  <h6 class="q-mb-sm items-center col">
    Most Mewmews <q-icon size="sm" name="forward" flat />
  </h6>
  <MewList
    class="q-mb-xl"
    :mews="store.topMewsList('mewmews', tabSelected)"
    :is-loading="store.isLoadingTop['mewmews']"
    :on-toggle-lick-mew="onToggleLickMew"
  />

  <h6 class="q-mb-sm">
    Most Quoted <q-icon size="sm" name="format_quote" flat />
  </h6>
  <MewList
    class="q-mb-xl"
    :mews="store.topMewsList('quotes', tabSelected)"
    :is-loading="store.isLoadingTop['quotes']"
    :on-toggle-lick-mew="onToggleLickMew"
  />
</template>
<script setup lang="ts">
import { useClutterStore } from "@/stores";
import { ref } from "vue";
import { ActionHash } from "@holochain/client";
import MewList from "@/components/MewList.vue";

const store = useClutterStore();
const tabSelected = ref<"day" | "week" | "month" | "year">("week");

const onToggleLickMew = async (hash: ActionHash) => store.reloadMew(hash);
</script>
