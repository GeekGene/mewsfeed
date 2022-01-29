<template>
  <context-provider
    :context="profilesStoreContext"
    :value="store"
  >
    <profile-prompt>
      <main-layout />
    </profile-prompt>
  </context-provider>
</template>

<script setup lang="ts">
import MainLayout from "./layouts/MainLayout.vue";
import {profilesStoreContext} from "@holochain-open-dev/profiles";
import { useProfileStore } from "./services/profile-store";

const store = useProfileStore();
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
