<template>
  <div
    v-if="!clientStore.isReady || !profilesStore || !isReady"
    class="row justify-center items-center"
    style="height: 100%"
  >
    <sl-spinner style="font-size: 4rem"></sl-spinner>
  </div>
  <template v-else>
    <HoloLogin v-if="IS_HOLO_HOSTED">
      <profiles-context v-if="profilesStore" :store="profilesStore">
        <MainLayout />
      </profiles-context>
    </HoloLogin>

    <profiles-context v-else :store="profilesStore">
      <MainLayout />
    </profiles-context>
  </template>
</template>

<script setup lang="ts">
import { provide } from "vue";
import { useClientStore, ClientStore, IS_HOLO_HOSTED } from "./stores/client";
import HoloLogin from "@/components/HoloLogin.vue";
import MainLayout from "@/layouts/MainLayout.vue";
import { ProfilesStore } from "@holochain-open-dev/profiles";
import { useProfilesStore } from "./stores/profiles";
import "@shoelace-style/shoelace/dist/components/spinner/spinner";

const { clientStore, isReady } = useClientStore();
const { profilesStore } = useProfilesStore();

provide<ClientStore>("clientStore", clientStore);
provide<ProfilesStore | undefined>("profilesStore", profilesStore.value);
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
