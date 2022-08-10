import "@holochain-open-dev/profiles/profiles-context";
import "@holochain-open-dev/profiles/profile-prompt";
import "@holochain-open-dev/profiles/agent-avatar";

import "@/css/main.sass";
import "quasar/src/css/index.sass";
import "@quasar/extras/material-icons/material-icons.css";
import { ProfilesService, ProfilesStore } from "@holochain-open-dev/profiles";
import { createPinia } from "pinia";
import { Notify, Quasar } from "quasar";
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { APP_WEB_SOCKET, connectCellClient } from "./services/clutter-dna";
import { PROFILE_STORE } from "./services/profile-store";

connectCellClient().then(async (cellClient) => {
  const app = createApp(App);
  app.provide(APP_WEB_SOCKET, cellClient);

  const profilesStore = new ProfilesStore(new ProfilesService(cellClient), {
    avatarMode: "avatar-required",
    additionalFields: ["Display name", "Bio", "Location"],
  });

  app.provide(PROFILE_STORE, profilesStore);

  app.use(createPinia());
  app.use(router);
  app.use(Quasar, {
    plugins: { Notify },
  });

  app.mount("#app");
});
