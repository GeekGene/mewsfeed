<template>
  <holo-login v-if="IS_HOLO_HOSTED">
    <profiles-context v-if="profilesStore" :store="profilesStore">
      <MainLayout />
    </profiles-context>
  </holo-login>

  <profiles-context v-else :store="profilesStore">
    <MainLayout />
  </profiles-context>
</template>

<script setup lang="ts">
import HoloLogin from "@/components/HoloLogin.vue";
import MainLayout from "@/layouts/MainLayout.vue";
import { useProfilesStore } from "./services/profiles-store";
import { IS_HOLO_HOSTED } from "./stores";

const profilesStore = useProfilesStore();
</script>

<style lang="sass">
#app
  font-family: Avenir, Helvetica, Arial, sans-serif
  -webkit-font-smoothing: antialiased
  -moz-osx-font-smoothing: grayscale

:root,
:host
  --sl-color-primary-600: #{$primary} !important
  --sl-color-primary-500: #{$primary} !important
</style>
