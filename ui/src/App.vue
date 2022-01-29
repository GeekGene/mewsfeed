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
import { clutterCell, useAppWebSocket } from "./services/clutter-dna";
import {
  ProfilesStore,
  profilesStoreContext,
} from "@holochain-open-dev/profiles";
import { HolochainClient } from "@holochain-open-dev/cell-client";

const appWs = useAppWebSocket();

const cellClient = new HolochainClient(appWs, clutterCell());
const store = new ProfilesStore(cellClient, {
  avatarMode: "avatar",
  additionalFields: ["Bio", "Location"],
});
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
