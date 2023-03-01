<template>
  <q-select
    v-model="selectedThemeName"
    class="text-white"
    :options="themeStore.themeNames"
    filled
  />
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useThemeStore } from "../stores/theme";

const themeStore = useThemeStore();
const selectedThemeName = ref(themeStore.activeTheme.name);

watch(selectedThemeName, (theme) => {
  themeStore.set(theme);
});
</script>
