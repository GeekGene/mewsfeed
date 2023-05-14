<template>
  <div
    v-if="loadingClient"
    class="row justify-center items-center"
    style="height: 100%"
  >
    <sl-spinner style="font-size: 4rem"></sl-spinner>
  </div>
  <template v-else>
    <HoloLogin v-if="IS_HOLO_HOSTED">
      <profiles-context :store="profilesStore">
        <MainLayout />
      </profiles-context>
    </HoloLogin>

    <profiles-context v-else :store="profilesStore">
      <MainLayout />
    </profiles-context>
    <div
      v-if="loadingCells"
      class="row justify-between"
      style="position: fixed; right: 25px; bottom: 25px"
    >
      <sl-spinner style="font-size: 1rem" class="q-mr-sm"></sl-spinner>
      <div>Cells loading...</div>
    </div>
  </template>
</template>

<script setup lang="ts">
import { computed, onMounted, provide, ref, toRaw } from "vue";
import { IS_HOLO_HOSTED, setupHolo, setupHolochain } from "./stores/client";
import HoloLogin from "@/components/HoloLogin.vue";
import MainLayout from "@/layouts/MainLayout.vue";
import { PROFILES_CONFIG } from "./stores/profiles";
import "@shoelace-style/shoelace/dist/components/spinner/spinner";
import {
  Profile,
  ProfilesClient,
  ProfilesStore,
} from "@holochain-open-dev/profiles";
import { AppAgentClient, AppInfo } from "@holochain/client";
import WebSdkApi from "@holo-host/web-sdk";
import { decode } from "@msgpack/msgpack";
import { MewsfeedDnaProperties } from "./types/types";
import asyncRetry from "async-retry";
import { CellType } from "@holochain/client";

const client = ref<AppAgentClient | WebSdkApi>();
const appInfo = ref<AppInfo>();
const profilesStore = ref<ProfilesStore>();
const myProfile = ref<Profile>();
const loadingClient = ref<boolean>(true);
const loadingCells = ref<boolean>(true);

const dnaProperties = computed(() =>
  appInfo.value
    ? (decode(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        appInfo.value.cell_info.mewsfeed[0][CellType.Provisioned].dna_modifiers
          .properties
      ) as MewsfeedDnaProperties)
    : {}
);

onMounted(() => {
  asyncRetry(setup, {
    factor: 1.3,
  });
});

const setup = async () => {
  // Setup client
  if (IS_HOLO_HOSTED) {
    client.value = await setupHolo();
  } else {
    client.value = await setupHolochain();
  }
  appInfo.value = await client.value.appInfo();

  // Setup profiles
  const profilesClient = new ProfilesClient(
    toRaw(client.value),
    "mewsfeed",
    "profiles"
  );
  profilesStore.value = new ProfilesStore(profilesClient, PROFILES_CONFIG);
  profilesStore.value.myProfile.subscribe((res) => {
    if (res.status === "complete" && res.value !== undefined) {
      myProfile.value = res.value;
    }
  });
  console.log("Profiles Store initialized");
  loadingClient.value = false;

  // Wait for cells to become responsive
  await client.value.callZome({
    role_name: "mewsfeed",
    zome_name: "ping",
    fn_name: "ping",
    payload: null,
  });
  console.log("Cells responding to zome calls");
  loadingCells.value = false;
};

provide("client", client);
provide("appInfo", appInfo);
provide("dnaProperties", dnaProperties);
provide("profilesStore", profilesStore);
provide("myProfile", myProfile);
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
