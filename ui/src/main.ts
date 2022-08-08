// Import the profiles elements that we need
import "@holochain-open-dev/profiles/profiles-context";
// import "@holochain-open-dev/profiles/create-profile";
// import "@holochain-open-dev/profiles/list-profiles";
import "@holochain-open-dev/profiles/agent-avatar";

import { createApp } from "vue";
import { createPinia } from "pinia";
import { Notify, Quasar } from "quasar";
import {
  connectAppWebSocket,
  APP_WEB_SOCKET,
  clutterCell,
  installed_app_id,
} from "./services/clutter-dna";
import { HolochainClient } from "@holochain-open-dev/cell-client";
import { ProfilesStore, ProfilesService } from "@holochain-open-dev/profiles";
import { PROFILE_STORE } from "./services/profile-store";
import App from "./App.vue";
import router from "./router";
import "quasar/src/css/index.sass";
import "@quasar/extras/material-icons/material-icons.css";
import "@/css/main.sass";

connectAppWebSocket().then(async (cellClient) => {
  const app = createApp(App);
  app.provide(APP_WEB_SOCKET, cellClient);

  // const client = new HolochainClient(appWebsocket);
  // const cellClient = client.forCell(clutterCell);

  const profilesStore = new ProfilesStore(new ProfilesService(cellClient), {
    avatarMode: "avatar-required",
    additionalFields: ["Display name", "Bio", "Location"],
  });

  // const store = new ProfilesStore(new ProfilesService(cellClient), {
  //   avatarMode: "avatar-required",
  //   additionalFields: ["Display name", "Bio", "Location"],
  // });
  app.provide(PROFILE_STORE, profilesStore);

  app.use(createPinia());
  app.use(router);
  app.use(Quasar, {
    plugins: { Notify },
  });

  app.mount("#app");
});
