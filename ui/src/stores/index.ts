import { makeUseClutterStore } from "@/stores/clutter";
import { StoreDefinition } from "pinia";
import makeUseClientStore from "uicommon/stores/useClientStore";
import makeUseHolochainStore from "uicommon/stores/useHolochainStore";
import makeUseHoloStore from "uicommon/stores/useHoloStore";

export const NATIVE_INSTALLED_APP_ID = "clutter";
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
      appName: "Clutter",
      skipRegistration: false,
      anonymousAllowed: true,
    },
  },
});

export type ClientStore = StoreDefinition<
  "client",
  {
    isReady: boolean;
    callZome: (params: {
      roleId: string;
      zomeName: string;
      fnName: string;
      payload: any;
    }) => any;
  }
>;

// On init is a hacky workaround. The proper place for that code is in the setup function of holofuelStore
// but to do that requires refactoring holofuelStore as a functional (aka setup store), as opposed to the object (aka option store)
// its currently in. We should do that soon, but for now we have an onInit callback for the clientStore factory

export const useClientStore: ClientStore = makeUseClientStore({
  useInterfaceStore: IS_HOLO_HOSTED ? useHoloStore : useHolochainStore,
  // onInit: () => {
  //   useSignalStore().addCallback((signal: AppSignal) =>
  //     useClutterStore().handleSignal(signal)
  //   );
  // },
});

export const useClutterStore = makeUseClutterStore();
