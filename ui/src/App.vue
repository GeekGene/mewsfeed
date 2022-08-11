<template>
  <profiles-context :store="profilesStore">
    <profile-prompt>
      <main-layout />
    </profile-prompt>
  </profiles-context>
</template>

<script setup lang="ts">
import MainLayout from "./layouts/MainLayout.vue";
import { useProfileStore } from "./services/profile-store";

const profilesStore = useProfileStore();
</script>

<style lang="sass">
#app
  font-family: Avenir, Helvetica, Arial, sans-serif
  -webkit-font-smoothing: antialiased
  -moz-osx-font-smoothing: grayscale

profiles-context
  --mdc-theme-primary: #{$primary}
  --mdc-theme-secondary: #{$primary}

  profile-prompt
    margin-top: 60px
</style>
