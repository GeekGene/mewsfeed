import { AdminWebsocket, CellType, AppWebsocket } from "@holochain/client";
import { WebConductorAppClient, waitForHolochain } from "@/hwc";
import type { Challenge } from "@/hwc";

export const HOLOCHAIN_APP_ID = "mewsfeed";
export const IS_LAUNCHER = (window as any).__HC_LAUNCHER_ENV__ !== undefined;

// Web Conductor extension detection
declare const __LINKER_URL__: string;
declare const __JOINING_SERVICE_URL__: string;
const LINKER_URL = typeof __LINKER_URL__ !== "undefined" ? __LINKER_URL__ : "http://localhost:8000";
const JOINING_SERVICE_URL = typeof __JOINING_SERVICE_URL__ !== "undefined" ? __JOINING_SERVICE_URL__ : "";
export let IS_HWC = false;

export interface SetupHolochainOptions {
  onChallenge?: (challenge: Challenge) => Promise<string>;
}

export const setupHolochain = async (opts?: SetupHolochainOptions) => {
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
        ...(JOINING_SERVICE_URL && {
          joiningServiceUrl: JOINING_SERVICE_URL,
          claims: {},
          onChallenge: opts?.onChallenge,
        }),
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
