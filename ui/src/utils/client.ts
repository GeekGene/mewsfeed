import { AdminWebsocket, CellType, AppWebsocket } from "@holochain/client";
import WebSdkApi, { AgentState } from "@holo-host/web-sdk";
import { WebConductorAppClient, waitForHolochain } from "@/hwc";

export const HOLOCHAIN_APP_ID = "mewsfeed";
export const IS_LAUNCHER = (window as any).__HC_LAUNCHER_ENV__ !== undefined;
export const IS_HOLO_HOSTED = import.meta.env.VITE_IS_HOLO_HOSTED;

// Web Conductor extension detection
declare const __LINKER_URL__: string;
const LINKER_URL = typeof __LINKER_URL__ !== "undefined" ? __LINKER_URL__ : "http://localhost:8000";
export let IS_HWC = false;

export const setupHolochain = async () => {
  try {
    // Check for web conductor extension first
    if ((window as any).holochain?.isWebConductor) {
      IS_HWC = true;
    } else {
      try {
        await waitForHolochain(3000);
        IS_HWC = true;
      } catch {
        // Not web conductor - fall through to normal setup
      }
    }

    if (IS_HWC) {
      console.log("Holochain extension detected, using WebConductorAppClient");
      const hwcClient = await WebConductorAppClient.connect({
        linkerUrl: LINKER_URL,
        roleName: "mewsfeed",
      });
      // Cast to AppWebsocket to satisfy type checker (different @holochain/client versions)
      return hwcClient as unknown as AppWebsocket;
    }

    let client;
    if (IS_LAUNCHER) {
      client = await AppWebsocket.connect({
        defaultTimeout: 60000,
      });
    } else {
      client = await createClient();
    }

    return client;
  } catch (e) {
    console.log("Holochain client setup error", e);
    throw e;
  }
};

export const setupHolo = async () => {
  const HOLO_CHAPERONE_URL = import.meta.env.VITE_CHAPERONE_SERVER_URL
    ? import.meta.env.VITE_CHAPERONE_SERVER_URL
    : "http://localhost:24274";

  try {
    const client = await WebSdkApi.connect({
      chaperoneUrl: HOLO_CHAPERONE_URL,
      authFormCustomization: {
        appName: "mewsfeed",
        requireRegistrationCode: false,
      },
    });

    await new Promise((resolve) =>
      client.on("agent-state", (state: AgentState) => {
        if (state.isAvailable && state.isAnonymous) {
          client.signUp({});
        } else if (state.isAvailable && !state.isAnonymous) {
          resolve(state);
        }
      })
    );

    return client;
  } catch (e) {
    console.log("Holo client setup error", e);
    throw e;
  }
};

// authenticate app websocket and set up zome call signing when run outside of launcher
const createClient = async () => {
  const adminWs = await AdminWebsocket.connect({
    url: new URL(`ws://localhost:${import.meta.env.VITE_HC_ADMIN_PORT}`),
  });
  const issued = await adminWs.issueAppAuthenticationToken({
    installed_app_id: HOLOCHAIN_APP_ID,
  });
  const client = await AppWebsocket.connect({
    url: new URL(`ws://localhost:${import.meta.env.VITE_HC_PORT}`),
    token: issued.token,
    defaultTimeout: 60000,
  });
  const cellInfo = client.cachedAppInfo?.cell_info.mewsfeed[0];
  if (!cellInfo || cellInfo.type !== CellType.Provisioned) {
    throw new Error("mewsfeed cell not provisioned");
  }
  const { cell_id } = cellInfo.value;
  await adminWs.authorizeSigningCredentials(cell_id);
  return client;
};
