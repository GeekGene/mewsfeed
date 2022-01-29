// Import the profiles elements that we need
import "@holochain-open-dev/profiles/profile-prompt";
import "@holochain-open-dev/profiles/my-profile";

// Import the context-provider element
import "@holochain-open-dev/context/context-provider";

import { createApp } from "vue";
import { Notify, Quasar } from "quasar";
import { connectAppWebSocket, APP_WEB_SOCKET, clutterCell } from "./services/clutter-dna";
import { HolochainClient } from "@holochain-open-dev/cell-client";
import { ProfilesStore } from "@holochain-open-dev/profiles";
import { PROFILE_STORE } from "./services/profile-store";
import App from "./App.vue";
import router from "./router";
import "quasar/src/css/index.sass";
import "@quasar/extras/material-icons/material-icons.css";

connectAppWebSocket().then((appWebsocket) => {
  const app = createApp(App);
  app.provide(APP_WEB_SOCKET, appWebsocket);

  const cellClient = new HolochainClient(appWebsocket, clutterCell);
  const store = new ProfilesStore(cellClient, {
    avatarMode: "avatar",
    additionalFields: ["Bio", "Location"],
  });
  app.provide(PROFILE_STORE, store);

  app.use(router);
  app.use(Quasar, {
    plugins: { Notify },
  });

  app.mount("#app");
});
