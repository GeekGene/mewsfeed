// Import the profiles elements that we need
import "@holochain-open-dev/profiles/profile-prompt";
import "@holochain-open-dev/profiles/list-profiles";

// Import the context-provider element
import "@holochain-open-dev/context/context-provider";

import { createApp } from "vue";
import { Notify, Quasar } from "quasar";
import { connectAppWebSocket, APP_WEB_SOCKET } from "./services/clutter-dna";
import App from "./App.vue";
import router from "./router";
import "quasar/src/css/index.sass";
import "@quasar/extras/material-icons/material-icons.css";

connectAppWebSocket().then((appService) => {
  const app = createApp(App);
  app.provide(APP_WEB_SOCKET, appService);

  app.use(router);
  app.use(Quasar, {
    plugins: { Notify },
  });

  app.mount("#app");
});
