import {
  AppInfo,
  AppAgentClient,
  CallZomeRequest,
  CallZomeResponse,
} from "@holochain/client";
import { StoreDefinition } from "pinia";
import makeUseClientStore from "uicommon/stores/useClientStore";
import makeUseHolochainStore from "uicommon/stores/useHolochainStore";
import makeUseHoloStore from "uicommon/stores/useHoloStore";

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

type HoloStore = StoreDefinition<
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

export type ClientStore = StoreDefinition<
  "client",
  {
    isReady: boolean;
    initialize(): Promise<AppAgentClient>;
    appInfo(): Promise<AppInfo>;
    callZome(request: CallZomeRequest): Promise<CallZomeResponse>;
  }
>;

export const useClientStore: ClientStore = makeUseClientStore({
  useInterfaceStore: IS_HOLO_HOSTED ? useHoloStore : useHolochainStore,
});
