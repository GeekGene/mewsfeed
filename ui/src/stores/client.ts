import { SigningCredentialsJson } from "@/types/types";
import {
  AppInfo,
  CallZomeRequest,
  CallZomeResponse,
  encodeHashToBase64,
  SigningCredentials,
  AdminWebsocket,
  CellType,
  GrantedFunctionsType,
  generateSigningKeyPair,
  setSigningCredentials,
  authorizeSigningCredentials,
  AgentPubKey,
  AppWebsocket,
} from "@holochain/client";
import asyncRetry from "async-retry";
import { Store } from "pinia";
import makeUseClientStore from "publisher-portal/src/stores/useClientStore";
import makeUseHolochainStore from "publisher-portal/src/stores/useHolochainStore";
import makeUseHoloStore from "publisher-portal/src/stores/useHoloStore";
import useSignalStore from "publisher-portal/src/stores/useSignalStore";
import { ref } from "vue";

export const NATIVE_INSTALLED_APP_ID = "mewsfeed";
export const NATIVE_HC_URI = `ws://localhost:${import.meta.env.VITE_HC_PORT}`;
export const IS_HOLO_HOSTED = Boolean(import.meta.env.VITE_IS_HOLO_HOSTED);

export const useHolochainStore = makeUseHolochainStore({
  installed_app_id: NATIVE_INSTALLED_APP_ID,
  app_ws_url: NATIVE_HC_URI,
});

const CHAPERONE_URL = import.meta.env.VITE_CHAPERONE_SERVER_URL
  ? import.meta.env.VITE_CHAPERONE_SERVER_URL
  : "http://localhost:24274";

type HoloStore = Store<
  "holo",
  {
    isAnonymous: boolean;
    isAvailable: boolean;
    isLoggedIn: boolean;
    isAuthFormOpen: boolean;
    isReady: boolean;
  }
>;

export const useHoloStore: HoloStore = makeUseHoloStore({
  connectionArgs: {
    chaperoneUrl: CHAPERONE_URL,
    authFormCustomization: {
      publisherName: "Holo Ltd.",
      appName: "MewsFeed",
      skipRegistration: false,
      anonymousAllowed: true,
    },
  },
});

export type ClientStore = Store<
  "client",
  {
    isReady: boolean;
    agentKey: AgentPubKey;
    initialize(): Promise<AppWebsocket>;
    appInfo(): Promise<AppInfo>;
    callZome(request: CallZomeRequest): Promise<CallZomeResponse>;
  }
>;

export const useClientStore = () => {
  const isReady = ref(false);

  const clientStore: ClientStore = makeUseClientStore({
    useInterfaceStore: IS_HOLO_HOSTED ? useHoloStore : useHolochainStore,
    onInit: () => {
      useSignalStore().addCallback((signal: any) => {
        console.log("Received conductor app client signal", signal);
      });
    },
  })();

  const setup = async () => {
    try {
      await clientStore.initialize();
      const appInfo = await clientStore.appInfo();

      if (typeof window === "object" && !("__HC_LAUNCHER_ENV__" in window)) {
        await setupClientAdminSigning(appInfo);
      }

      isReady.value = true;
    } catch (e) {
      console.log("Conductor app client setup error", e);
      throw e;
    }
  };

  asyncRetry(setup);

  return { clientStore, isReady };
};

// set up zome call signing when run outside of launcher
export const setupClientAdminSigning = async (appInfo: AppInfo) => {
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
};
