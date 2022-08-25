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
import { Notify, Quasar } from "quasar";
import "quasar/src/css/index.sass";
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { PROFILE_STORE } from "./services/profile-store";
import { NATIVE_INSTALLED_APP_ID, useClientStore } from "./stores";
import { CLUTTER_ROLE_ID } from "./stores/clutter";
import { serializeHash } from "@holochain-open-dev/utils";

const app = createApp(App);
app.use(router);
app.use(Quasar, {
  plugins: { Notify },
});
app.use(createPinia());

const isHoloHosted = Boolean(import.meta.env.VITE_IS_HOLO_HOSTED);
if (isHoloHosted) {
  useClientStore()
    .initialize()
    .then(async (client: any) => {
      const appInfo: AppInfoResponse = await client.appInfo({
        installed_app_id: NATIVE_INSTALLED_APP_ID,
      });
      const holoClient = new HoloClient(client, appInfo);
      const cell = appInfo.cell_data.find(
        (cell) => cell.role_id === CLUTTER_ROLE_ID
      );
      if (!cell) {
        throw new Error('Could not find cell "clutter"');
      }
      const cellClient = new CellClient(holoClient, cell);
      const profilesStore = new ProfilesStore(new ProfilesService(cellClient), {
        avatarMode: "avatar-required",
        additionalFields: ["Display name", "Bio", "Location"],
      });
      app.provide(PROFILE_STORE, profilesStore);

      app.mount("#app");
    });
} else {
  useClientStore()
    .initialize()
    .then(async (client: any) => {
      const appInfo: AppInfoResponse = await client.appInfo({
        installed_app_id: NATIVE_INSTALLED_APP_ID,
      });
      const holochainClient = new HolochainClient(client);
      const cell = appInfo.cell_data.find(
        (cell) => cell.role_id === CLUTTER_ROLE_ID
      );
      if (!cell) {
        throw new Error('Could not find cell "clutter"');
      }
      const cellClient = new CellClient(holochainClient, cell);
      const profilesStore = new ProfilesStore(new ProfilesService(cellClient), {
        avatarMode: "avatar-required",
        additionalFields: ["Display name", "Bio", "Location"],
      });
      app.provide(PROFILE_STORE, profilesStore);

      app.mount("#app");
    });
}
