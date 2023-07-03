<template>
  <div
    v-if="loadingClient"
    class="h-screen w-full flex justify-center items-center"
  >
    <sl-spinner style="font-size: 2rem" class="mr-4"></sl-spinner>
    <h6>Connecting...</h6>
  </div>

  <div
    v-else
    class="bg-base w-full flex justify-center items-center relative font-content cursor-default"
  >
    <profiles-context :store="profilesStore">
      <HoloLogin v-if="IS_HOLO_HOSTED">
        <MainLayout />
      </HoloLogin>

      <MainLayout v-else />

      <div
        v-if="loadingCells"
        class="flex justify-start items-center fixed right-5 top-0 my-8 mx-4 py-4 badge badge-warning z-50 shadow-md"
      >
        <sl-spinner style="font-size: 1rem" class="mr-2"></sl-spinner>
        <div>Cells loading...</div>
      </div>
    </profiles-context>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, provide, ref, toRaw, watch } from "vue";
import { IS_HOLO_HOSTED, setupHolo, setupHolochain } from "@/utils/client";
import HoloLogin from "@/components/HoloLogin.vue";
import MainLayout from "@/layouts/MainLayout.vue";
import { PROFILES_CONFIG } from "@/utils/profiles";
import "@shoelace-style/shoelace/dist/components/spinner/spinner";
import {
  Profile,
  ProfilesClient,
  ProfilesStore,
} from "@holochain-open-dev/profiles";
import { AppAgentClient, AppInfo, encodeHashToBase64 } from "@holochain/client";
import WebSdkApi from "@holo-host/web-sdk";
import { decode } from "@msgpack/msgpack";
import { MewsfeedDnaProperties } from "./types/types";
import asyncRetry from "async-retry";
import { CellType } from "@holochain/client";
import { QueryClient } from "@tanstack/vue-query";
import { setHomeRedirect } from "@/utils/homeRedirect";
import { useThemeStore } from "@/stores/theme";

const client = ref<AppAgentClient | WebSdkApi>();
const appInfo = ref<AppInfo>();
const profilesStore = ref<ProfilesStore>();
const myProfile = ref<Profile>();
const loadingClient = ref<boolean>(true);
const loadingCells = ref<boolean>(true);
const themeStore = useThemeStore();
themeStore.apply();

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

const queryClient = new QueryClient();

watch(client, (newClient) => {
  if (!newClient) return;

  const myPubKeyB64 = encodeHashToBase64(newClient.myPubKey);
  const cachedPubKeyB64 = localStorage.getItem("myPubKeyB64");

  if (myPubKeyB64 !== cachedPubKeyB64) {
    queryClient.clear();
    localStorage.setItem("myPubKeyB64", myPubKeyB64);
    setHomeRedirect(true);

    console.log("Clearing query client cache");
  }
});

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
  --sl-color-primary-600: #FF5C00 !important
  --sl-color-primary-500: #FF5C00 !important
</style>
