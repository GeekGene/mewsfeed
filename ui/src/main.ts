import "@holochain-open-dev/profiles/agent-avatar";
import "@holochain-open-dev/profiles/my-profile";
import "@holochain-open-dev/profiles/profile-prompt";
import "@holochain-open-dev/profiles/profiles-context";

import "@/css/main.sass";
import { ProfilesClient, ProfilesStore } from "@holochain-open-dev/profiles";
import {
  AdminWebsocket,
  AppAgentWebsocket,
  AppInfoResponse,
  CellType,
} from "@holochain/client";
import "@quasar/extras/material-icons/material-icons.css";
import { createPinia } from "pinia";
import { Dialog, Notify, Quasar } from "quasar";
import "quasar/src/css/index.sass";
import { createApp, ref, watch } from "vue";
import App from "./App.vue";
import router from "./router";
import { PROFILES_STORE } from "./services/profiles-store";
import {
  IS_HOLO_HOSTED,
  NATIVE_HC_URI,
  NATIVE_INSTALLED_APP_ID,
  useClientStore,
} from "./stores";
import { CLUTTER_ROLE_NAME } from "./stores/clutter";
import { PROFILE_FIELDS } from "./types/types";

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
  if (!(CellType.Provisioned in appInfo.cell_info[CLUTTER_ROLE_NAME][0])) {
    throw new Error('Could not find cell "clutter"');
  }
  const cell = appInfo.cell_info[CLUTTER_ROLE_NAME][0][CellType.Provisioned];

  // const { cell_id } =
  //   appInfo.cell_info[CLUTTER_ROLE_NAME][0][CellType.Provisioned];

  // const cellIdB64 =
  //   encodeHashToBase64(cell_id[0]) + encodeHashToBase64(cell_id[1]);
  // const signingCredentialsJson = localStorage.getItem(cellIdB64);
  // let signingCredentials: SigningCredentials | null =
  //   signingCredentialsJson && JSON.parse(signingCredentialsJson);
  // console.log("signing cred", signingCredentials);
  // if (!signingCredentials) {
  //   const [keyPair, signingKey] = generateSigningKeyPair();
  //   const adminWs = await AdminWebsocket.connect("ws://localhost:65000");
  //   const capSecret = await adminWs.grantSigningKey(
  //     cell_id,
  //     { [GrantedFunctionsType.All]: null },
  //     signingKey
  //   );
  //   signingCredentials = {
  //     capSecret,
  //     keyPair,
  //     signingKey,
  //   };
  // }
  // setSigningCredentials(cell_id, signingCredentials);
  // localStorage.setItem(cellIdB64, JSON.stringify(signingCredentials));

  const adminWs = await AdminWebsocket.connect("ws://localhost:65000");
  await adminWs.authorizeSigningCredentials(cell.cell_id);
  profilesStore.value = new ProfilesStore(
    new ProfilesClient(holochainClient, CLUTTER_ROLE_NAME),
    {
      avatarMode: "avatar-required",
      additionalFields: [
        PROFILE_FIELDS.DISPLAY_NAME,
        PROFILE_FIELDS.BIO,
        PROFILE_FIELDS.LOCATION,
      ],
    }
  );
};
