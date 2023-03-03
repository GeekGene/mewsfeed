<template>
  <div class="bg-info">
    <q-select
      v-model="selectedThemeName"
      :options="themeStore.themeNames"
      filled
    />
  </div>
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
