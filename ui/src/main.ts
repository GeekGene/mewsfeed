import "@holochain-open-dev/profiles/elements/agent-avatar.js";
import "@holochain-open-dev/profiles/elements/my-profile.js";
import "@holochain-open-dev/profiles/elements/profiles-context.js";
import "@holochain-open-dev/profiles/elements/create-profile.js";
import "@holochain-open-dev/elements/elements/holo-identicon.js";

import "@/css/main.sass";
import { ProfilesStore, ProfilesClient } from "@holochain-open-dev/profiles";
import {
  AdminWebsocket,
  AppAgentWebsocket,
  AppInfoResponse,
  CellType,
  encodeHashToBase64,
  generateSigningKeyPair,
  GrantedFunctionsType,
  setSigningCredentials,
  SigningCredentials,
} from "@holochain/client";
import "@quasar/extras/material-icons/material-icons.css";
import { createPinia } from "pinia";
import { Dialog, Notify, Quasar } from "quasar";
import "quasar/src/css/index.sass";
import { createApp, ref, watch } from "vue";
import App from "./App.vue";
import router from "./router";
import { PROFILES_STORE } from "./stores/profiles";
import {
  IS_HOLO_HOSTED,
  NATIVE_HC_URI,
  NATIVE_INSTALLED_APP_ID,
  useClientStore,
} from "./stores/client";
import { SigningCredentialsJson, PROFILE_FIELDS } from "./types/types";

// Shoelace
import "@shoelace-style/shoelace/dist/themes/light.css";
import "@shoelace-style/shoelace/dist/themes/dark.css";
import { setBasePath } from "@shoelace-style/shoelace/dist/utilities/base-path";
setBasePath("shoelace");

const app = createApp(App);
app.use(router);
app.use(Quasar, {
  plugins: { Dialog, Notify },
});
app.use(createPinia());

const profilesStore = ref<ProfilesStore>();
app.provide(PROFILES_STORE, profilesStore);

const clientStore = useClientStore();
clientStore.initialize().then(async (client: any) => {
  if (IS_HOLO_HOSTED) {
    app.mount("#app");
    if (!client.agent.isAnonymous && client.agent.isAvailable) {
      initProfileStore(client);
    } else {
      const clientLogIn = new Promise((resolve) => {
        const stopWatching = watch(
          () => clientStore.agentKey,
          async () => {
            if (clientStore.isReady) {
              initProfileStore(client);
              stopWatching();
              resolve(undefined);
            }
          }
        );
      });
      await clientLogIn;
    }
  } else {
    await initProfileStore(client);
    app.mount("#app");
  }
});

const initProfileStore = async (client: any) => {
  const appInfo: AppInfoResponse = await client.appInfo({
    installed_app_id: NATIVE_INSTALLED_APP_ID,
  });
  const holochainClient = await AppAgentWebsocket.connect(
    NATIVE_HC_URI,
    NATIVE_INSTALLED_APP_ID
  );
  if (!(CellType.Provisioned in appInfo.cell_info.mewsfeed[0])) {
    throw new Error('Could not find cell "mewsfeed"');
  }

  // set up zome call signing when run outside of launcher
  const __HC_LAUNCHER_ENV__ = "__HC_LAUNCHER_ENV__";
  if (typeof window === "object" && !(__HC_LAUNCHER_ENV__ in window)) {
    const { cell_id } = appInfo.cell_info.mewsfeed[0][CellType.Provisioned];

    const cellIdB64 =
      encodeHashToBase64(cell_id[0]) + encodeHashToBase64(cell_id[1]);
    const storedSigningCredentials = localStorage.getItem(cellIdB64);
    let signingCredentialsJson: SigningCredentialsJson | null =
      storedSigningCredentials && JSON.parse(storedSigningCredentials);
    let signingCredentials: SigningCredentials | null =
      signingCredentialsJson && {
        capSecret: Uint8Array.from(signingCredentialsJson.capSecret),
        keyPair: {
          publicKey: Uint8Array.from(signingCredentialsJson.keyPair.publicKey),
          secretKey: Uint8Array.from(signingCredentialsJson.keyPair.secretKey),
        },
        signingKey: Uint8Array.from(signingCredentialsJson.signingKey),
      };

    if (!signingCredentials) {
      localStorage.clear();
      const [keyPair, signingKey] = generateSigningKeyPair();
      const adminWs = await AdminWebsocket.connect(
        `ws://localhost:${import.meta.env.VITE_HC_ADMIN_PORT}`
      );
      const capSecret = await adminWs.grantSigningKey(
        cell_id,
        { [GrantedFunctionsType.All]: null },
        signingKey
      );
      signingCredentials = {
        capSecret,
        keyPair,
        signingKey,
      };
      signingCredentialsJson = {
        capSecret: Array.from(capSecret),
        keyPair: {
          publicKey: Array.from(keyPair.publicKey),
          secretKey: Array.from(keyPair.secretKey),
        },
        signingKey: Array.from(signingKey),
      };
    }
    setSigningCredentials(cell_id, signingCredentials);
    localStorage.setItem(cellIdB64, JSON.stringify(signingCredentialsJson));
  }

  profilesStore.value = new ProfilesStore(
    new ProfilesClient(holochainClient, "mewsfeed"),
    {
      avatarMode: "avatar-optional",
      additionalFields: [
        {
          name: PROFILE_FIELDS.DISPLAY_NAME,
          label: PROFILE_FIELDS.DISPLAY_NAME,
          required: false,
        },

        {
          name: PROFILE_FIELDS.BIO,
          label: PROFILE_FIELDS.BIO,
          required: false,
        },
        {
          name: PROFILE_FIELDS.LOCATION,
          label: PROFILE_FIELDS.LOCATION,
          required: false,
        },
      ],
    }
  );
};
