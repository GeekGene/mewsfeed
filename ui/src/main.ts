import "./index.css";
import "@fontsource/syne/700.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/700.css";
import "@fontsource/space-mono";
import "@holochain-open-dev/profiles/dist/elements/agent-avatar.js";
import "@holochain-open-dev/profiles/dist/elements/my-profile.js";
import "@holochain-open-dev/profiles/dist/elements/profiles-context.js";
import "@holochain-open-dev/profiles/dist/elements/create-profile.js";
import { createApp } from "vue";
import { createPinia } from "pinia";
import VueObserveVisibility from "vue-observe-visibility";
import App from "./App.vue";
import { router } from "./router";
import piniaPluginPersistedState from "pinia-plugin-persistedstate";
import {
  VueQueryPlugin,
  type VueQueryPluginOptions,
} from "@tanstack/vue-query";
import {
  PersistedClient,
  persistQueryClient,
} from "@tanstack/query-persist-client-core";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { encode, decode } from "@msgpack/msgpack";

// Floating vue (tooltips)
import FloatingVue from "floating-vue";
import "floating-vue/dist/style.css";

// Shoelace
import "@shoelace-style/shoelace/dist/themes/light.css";
import "@shoelace-style/shoelace/dist/themes/dark.css";
import { setBasePath } from "@shoelace-style/shoelace/dist/utilities/base-path";
import { decodeHashFromBase64, encodeHashToBase64 } from "@holochain/client";
import { setupHomeRedirect } from "./utils/homeRedirect";
setBasePath("shoelace");

// Lightbox
import "vue-easy-lightbox/dist/external-css/vue-easy-lightbox.css";

// Setup @tanstack/query
const vueQueryOptions: VueQueryPluginOptions = {
  queryClientConfig: {
    defaultOptions: {
      queries: {
        cacheTime: 1000 * 60 * 15, // 15 minutes
        staleTime: 100,
        refetchOnMount: "always",
        refetchOnWindowFocus: "always",
        refetchOnReconnect: "always",
        retryOnMount: true,
      },
    },
  },
  clientPersister: (queryClient) => {
    return persistQueryClient({
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
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
      maxAge: 1000 * 60 * 60 * 2, // 2 hours
    });
  },
};

// Setup home page redirection
setupHomeRedirect();

// Setup app
const app = createApp(App);
const pinia = createPinia();
pinia.use(piniaPluginPersistedState);
app.use(pinia);
app.use(router);
app.use(VueObserveVisibility);
app.use(VueQueryPlugin, vueQueryOptions);
app.use(FloatingVue);
app.mount("#app");
