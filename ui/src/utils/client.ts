import { AdminWebsocket, CellType, AppWebsocket } from "@holochain/client";
import WebSdkApi, { AgentState } from "@holo-host/web-sdk";
import { FishyAppClient, waitForFishy } from "@/fishy";

export const HOLOCHAIN_APP_ID = "mewsfeed";
export const IS_LAUNCHER = (window as any).__HC_LAUNCHER_ENV__ !== undefined;
export const IS_HOLO_HOSTED = import.meta.env.VITE_IS_HOLO_HOSTED;

// Fishy extension detection
declare const __GATEWAY_URL__: string;
const GATEWAY_URL = typeof __GATEWAY_URL__ !== "undefined" ? __GATEWAY_URL__ : "http://localhost:8000";
export let IS_FISHY = false;

export const setupHolochain = async () => {
  try {
    // Check for fishy extension first
    if ((window as any).holochain?.isFishy) {
      IS_FISHY = true;
    } else {
      try {
        await waitForFishy(3000);
        IS_FISHY = true;
      } catch {
        // Not fishy - fall through to normal setup
      }
    }

    if (IS_FISHY) {
      console.log("Fishy extension detected, using FishyAppClient");
      const fishyClient = await FishyAppClient.connect({
        gatewayUrl: GATEWAY_URL,
        roleName: "mewsfeed",
      });
      // Cast to AppWebsocket to satisfy type checker (different @holochain/client versions)
      return fishyClient as unknown as AppWebsocket;
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
