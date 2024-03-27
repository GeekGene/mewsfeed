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
    class="w-full flex justify-center items-center relative font-content cursor-default"
  >
    <profiles-context :store="profilesStore">
      <MainLayout />

      <div
        v-if="loadingCells"
        class="flex justify-start items-center fixed right-5 top-0 my-8 mx-4 py-4 badge badge-warning z-50"
      >
        <sl-spinner style="font-size: 1rem" class="mr-2"></sl-spinner>
        <div>Cells loading...</div>
      </div>

      <NetworkInfo
        v-else
        class="flex justify-start items-center fixed right-5 bottom-5 my-8 mx-4 z-50"
      />
    </profiles-context>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, provide, ref, toRaw, watch } from "vue";
import { IS_HOLO_HOSTED, setupHolo, setupHolochain } from "@/utils/client";
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
import { setHomeRedirect } from "@/utils/homeRedirect";
import { useThemeStore } from "@/stores/theme";
import { useQueryClient } from "@tanstack/vue-query";
import NetworkInfo from "./components/NetworkInfo.vue";

const client = ref<AppAgentClient | WebSdkApi>();
const appInfo = ref<AppInfo>();
const profilesStore = ref<ProfilesStore>();
const myProfile = ref<Profile>();
const loadingClient = ref<boolean>(true);
const loadingCells = ref<boolean>(true);
const themeStore = useThemeStore();
themeStore.apply();
const queryClient = useQueryClient();

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
  setup();
});

const setup = async () => {
  // Setup client
  if (IS_HOLO_HOSTED) {
    client.value = await setupHolo();
  } else {
    client.value = await asyncRetry(setupHolochain, {
      factor: 1.3,
    });
  }

  await asyncRetry(setupApp, {
    factor: 1.3,
  });
};

const setupApp = async () => {
  if (!client.value) throw Error("Holo / Holochain client not ready");

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
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
      myProfile.value = res.value.entry;
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

<style>
#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

:root,
:host {
  --sl-color-primary-50: hsl(var(--p)) !important;
  --sl-color-primary-100: hsl(var(--p)) !important;
  --sl-color-primary-200: hsl(var(--p)) !important;
  --sl-color-primary-300: hsl(var(--p)) !important;
  --sl-color-primary-400: hsl(var(--p)) !important;
  --sl-color-primary-500: hsl(var(--p)) !important;
  --sl-color-primary-600: hsl(var(--pf)) !important;
  --sl-color-primary-700: hsl(var(--pf)) !important;
  --sl-color-primary-800: hsl(var(--pf)) !important;
  --sl-color-primary-900: hsl(var(--pf)) !important;

  --sl-color-neutral-0: hsl(var(--b2)) !important;
  --sl-color-neutral-50: hsl(var(--b2)) !important;
  --sl-color-neutral-100: hsl(var(--b2)) !important;
  --sl-color-neutral-200: hsl(var(--b2)) !important;
  --sl-color-neutral-300: hsl(var(--b2)) !important;
  --sl-color-neutral-400: hsl(var(--b3)) !important;
  --sl-color-neutral-500: hsl(var(--b3)) !important;
  --sl-color-neutral-600: hsl(var(--b3)) !important;
  --sl-color-neutral-700: hsl(var(--bc)) !important;
  --sl-color-neutral-800: hsl(var(--bc)) !important;
  --sl-color-neutral-900: hsl(var(--bc)) !important;

  --sl-color-neutral-1000: hsl(var(--bc)) !important;

  --sl-input-color: hsl(var(--bc)) !important;
  --sl-input-color-hover: hsl(var(--bc)) !important;
  --sl-input-color-focus: hsl(var(--bc)) !important;
  --sl-input-background-color: hsl(var(--b2)) !important;
  --sl-input-background-focus: hsl(var(--b2)) !important;
  --sl-input-background-hover: hsl(var(--b2)) !important;
  --sl-input-border-color: hsl(var(--b2)) !important;
  --sl-input-border-color-hover: hsl(var(--b2)) !important;
  --sl-input-border-color-focus: hsl(var(--b2)) !important;
  --sl-input-border-width: hsl(var(--b2)) !important;
  --sl-input-help-text-color: hsl(var(--nc)) !important;
}
</style>
