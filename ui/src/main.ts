import "@holochain-open-dev/profiles/dist/elements/agent-avatar.js";
import "@holochain-open-dev/profiles/dist/elements/my-profile.js";
import "@holochain-open-dev/profiles/dist/elements/profiles-context.js";
import "@holochain-open-dev/profiles/dist/elements/create-profile.js";
import "@holochain-open-dev/elements/dist/elements/holo-identicon.js";
import "@/css/main.sass";
import "material-icons/iconfont/material-icons.css";
import "quasar/src/css/index.sass";
import { Dialog, Notify, Quasar } from "quasar";
import { createApp } from "vue";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import VueObserveVisibility from "vue-observe-visibility";
import App from "./App.vue";
import { router } from "./router";

// Shoelace
import "@shoelace-style/shoelace/dist/themes/light.css";
import "@shoelace-style/shoelace/dist/themes/dark.css";
import { setBasePath } from "@shoelace-style/shoelace/dist/utilities/base-path";
setBasePath("shoelace");

const app = createApp(App);
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
app.use(pinia);
app.use(router);
app.use(Quasar, {
  plugins: { Dialog, Notify },
});
app.use(VueObserveVisibility);
app.mount("#app");
