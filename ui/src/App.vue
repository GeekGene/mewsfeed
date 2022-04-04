<template>
  <context-provider :context="profilesStoreContext" :value="store">
    <profile-prompt>
      <main-layout />
    </profile-prompt>
  </context-provider>
</template>

<script setup lang="ts">
import MainLayout from "./layouts/MainLayout.vue";
import { profilesStoreContext } from "@holochain-open-dev/profiles";
import { useProfileStore } from "./services/profile-store";

const store = useProfileStore();
</script>

<style lang="sass">
#app
  font-family: Avenir, Helvetica, Arial, sans-serif
  -webkit-font-smoothing: antialiased
  -moz-osx-font-smoothing: grayscale

context-provider
  --mdc-theme-primary: #{$primary}
  --mdc-theme-secondary: #{$primary}

  profile-prompt
    margin-top: 60px
</style>
