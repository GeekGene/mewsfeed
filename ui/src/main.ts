// Import the profiles elements that we need
import "@holochain-open-dev/profiles/agent-avatar";
import "@holochain-open-dev/profiles/my-profile";
import "@holochain-open-dev/profiles/profile-prompt";

// Import the context-provider element
import "@holochain-open-dev/context/context-provider";

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
import { ProfilesStore } from "@holochain-open-dev/profiles";
import { PROFILE_STORE } from "./services/profile-store";
import App from "./App.vue";
import router from "./router";
import "quasar/src/css/index.sass";
import "@quasar/extras/material-icons/material-icons.css";
import "@/css/main.sass";

connectAppWebSocket().then(async (appWebsocket) => {
  const app = createApp(App);
  app.provide(APP_WEB_SOCKET, appWebsocket);

  const client = await HolochainClient.connect(
    appWebsocket.client.socket.url,
    installed_app_id
  );
  const cellClient = client.forCell(clutterCell);

  const store = new ProfilesStore(cellClient, {
    avatarMode: "avatar",
    additionalFields: ["Display name", "Bio", "Location"],
  });
  app.provide(PROFILE_STORE, store);

  app.use(createPinia());
  app.use(router);
  app.use(Quasar, {
    plugins: { Notify },
  });

  app.mount("#app");
});
