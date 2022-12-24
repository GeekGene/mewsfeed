import "@holochain-open-dev/profiles/agent-avatar";
import "@holochain-open-dev/profiles/my-profile";
import "@holochain-open-dev/profiles/profile-prompt";
import "@holochain-open-dev/profiles/profiles-context";

import "@/css/main.sass";
import {
  CellClient,
  HolochainClient,
  HoloClient,
} from "@holochain-open-dev/cell-client";
import { ProfilesService, ProfilesStore } from "@holochain-open-dev/profiles";
import { AppInfoResponse } from "@holochain/client";
import "@quasar/extras/material-icons/material-icons.css";
import { createPinia } from "pinia";
import { Dialog, Notify, Quasar } from "quasar";
import "quasar/src/css/index.sass";
import { createApp, ref, watch } from "vue";
import App from "./App.vue";
import router from "./router";
import { PROFILES_STORE } from "./services/profiles-store";
import {
  IS_HOLO_HOSTED,
  NATIVE_INSTALLED_APP_ID,
  useClientStore,
} from "./stores";
import { CLUTTER_ROLE_NAME } from "./stores/clutter";
import { PROFILE_FIELDS } from "./types/types";

const app = createApp(App);
app.use(router);
app.use(Quasar, {
  plugins: { Dialog, Notify },
});
app.use(createPinia());

const profilesStore = ref<ProfilesStore>();
app.provide(PROFILES_STORE, profilesStore);

const clientStore = useClientStore();
clientStore.initialize().then(async (client: any) => {
  if (IS_HOLO_HOSTED) {
    app.mount("#app");
    if (!client.agent.isAnonymous && client.agent.isAvailable) {
      initProfileStore(client);
    } else {
      const clientLogIn = new Promise((resolve) => {
        const stopWatching = watch(
          () => clientStore.agentKey,
          async () => {
            if (clientStore.isReady) {
              initProfileStore(client);
              stopWatching();
              resolve(undefined);
            }
          }
        );
      });
      await clientLogIn;
    }
  } else {
    await initProfileStore(client);
    app.mount("#app");
  }
});

const initProfileStore = async (client: any) => {
  const appInfo: AppInfoResponse = await client.appInfo({
    installed_app_id: NATIVE_INSTALLED_APP_ID,
  });
  const holochainClient = IS_HOLO_HOSTED
    ? new HoloClient(client, appInfo)
    : new HolochainClient(client);
  console.log("hello");
  client.on("sepp", () => console.log("hello"));
  const cell = appInfo.cell_data.find(
    (cell) => cell.role_name === CLUTTER_ROLE_NAME
  );
  if (!cell) {
    throw new Error('Could not find cell "clutter"');
  }
  const cellClient = new CellClient(holochainClient, cell);
  profilesStore.value = new ProfilesStore(
    // eslint-disable-next-line
    // @ts-ignore
    new ProfilesService(cellClient),
    {
      avatarMode: "avatar-required",
      additionalFields: [
        PROFILE_FIELDS.DISPLAY_NAME,
        PROFILE_FIELDS.BIO,
        PROFILE_FIELDS.LOCATION,
      ],
    }
  );
};
