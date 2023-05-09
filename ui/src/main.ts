import "@holochain-open-dev/profiles/elements/agent-avatar.js";
import "@holochain-open-dev/profiles/elements/my-profile.js";
import "@holochain-open-dev/profiles/elements/profiles-context.js";
import "@holochain-open-dev/profiles/elements/create-profile.js";
import "@holochain-open-dev/elements/elements/holo-identicon.js";

import "@/css/main.sass";

import "@quasar/extras/material-icons/material-icons.css";
import { createPinia } from "pinia";
import { Dialog, Notify, Quasar } from "quasar";
import "quasar/src/css/index.sass";
import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router";
import { Buffer } from "buffer";
window.Buffer = Buffer;

// Shoelace
import "@shoelace-style/shoelace/dist/themes/light.css";
import "@shoelace-style/shoelace/dist/themes/dark.css";
import { setBasePath } from "@shoelace-style/shoelace/dist/utilities/base-path";
setBasePath("shoelace");

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(Quasar, {
  plugins: { Dialog, Notify },
});
app.mount("#app");
