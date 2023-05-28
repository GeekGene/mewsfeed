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
import VueObserveVisibility from "vue-observe-visibility";
import App from "./App.vue";
import { router } from "./router";
import piniaPluginPersistedState from "pinia-plugin-persistedstate";
import {
  QueryClient,
  VueQueryPlugin,
  type VueQueryPluginOptions,
} from "@tanstack/vue-query";
import {
  PersistedClient,
  persistQueryClient,
} from "@tanstack/query-persist-client-core";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { encode, decode } from "@msgpack/msgpack";

// Shoelace
import "@shoelace-style/shoelace/dist/themes/light.css";
import "@shoelace-style/shoelace/dist/themes/dark.css";
import { setBasePath } from "@shoelace-style/shoelace/dist/utilities/base-path";
import { decodeHashFromBase64, encodeHashToBase64 } from "@holochain/client";
setBasePath("shoelace");

// Setup @tanstack/query
const vueQueryOptions: VueQueryPluginOptions = {
  queryClientConfig: {
    defaultOptions: {
      queries: {
        cacheTime: 1000 * 60 * 60 * 24, // 24 hours
        staleTime: 1000 * 60 * 5, // 5 minutes
      },
    },
  },
  clientPersister: (queryClient: QueryClient) => {
    return persistQueryClient({
      queryClient,
      persister: createSyncStoragePersister({
        storage: localStorage,
        key: "QUERY_PERSIST_CACHE",
        serialize: (client: PersistedClient): string =>
          JSON.stringify({
            ...client,
            clientState: encodeHashToBase64(encode(client.clientState)),
          }),
        deserialize: (cachedString: string): PersistedClient => {
          const persistedClient = JSON.parse(cachedString);
          persistedClient.clientState = decode(
            decodeHashFromBase64(persistedClient.clientState)
          );
          return persistedClient;
        },
        throttleTime: 250,
      }),
      maxAge: Infinity,
    });
  },
};

const app = createApp(App);
const pinia = createPinia();
pinia.use(piniaPluginPersistedState);
app.use(pinia);
app.use(router);
app.use(Quasar, {
  plugins: { Dialog, Notify },
});
app.use(VueObserveVisibility);
app.use(VueQueryPlugin, vueQueryOptions);
app.mount("#app");
