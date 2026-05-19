import { AdminWebsocket, CellType, AppWebsocket } from "@holochain/client";
import { waitForHolochain } from "@/hwc";
import { connectWithJoiningUI } from "@holo-host/web-conductor-client/ui";
import { getRuntime, Runtime } from "@holo-host/web-conductor-client/runtime";

export const HOLOCHAIN_APP_ID = "mewsfeed";

// Joining service URL (compile-time or empty)
declare const __JOINING_SERVICE_URL__: string;
export const JOINING_SERVICE_URL = typeof __JOINING_SERVICE_URL__ !== "undefined" ? __JOINING_SERVICE_URL__ : "";

// Runtime context — determined by the serving environment, not probed
export const RUNTIME = getRuntime();
export const IS_HWC = RUNTIME === Runtime.HWC;

export interface SetupHolochainOptions {
  mountTo?: HTMLElement;
}

/**
 * Wait for the HWC extension to inject window.holochain.
 * Only called when we already know we're in HWC context.
 * Returns true if the extension is present.
 */
export const waitForExtension = async (): Promise<boolean> => {
  if ((window as any).holochain?.isWebConductor) {
    return true;
  }
  try {
    await waitForHolochain(3000);
    return true;
  } catch {
    return false;
  }
};

export const setupHolochain = async (opts?: SetupHolochainOptions) => {
  try {
    if (IS_HWC) {
      const params = new URLSearchParams(window.location.search);
      const linkerUrl = params.get("linkerUrl") || undefined;
      // Query-string override lets e2e tests point at a local joining service;
      // falls back to the compile-time JOINING_SERVICE_URL.
      const joiningServiceUrl =
        params.get("joiningServiceUrl") || JOINING_SERVICE_URL || undefined;
      console.log("HWC runtime context, joiningServiceUrl:", joiningServiceUrl || "(empty)");
      const hwcClient = await connectWithJoiningUI({
        roleName: "mewsfeed",
        ...(linkerUrl && { linkerUrl }),
        ...(joiningServiceUrl && {
          joiningServiceUrl,
        }),
        ...(opts?.mountTo && { mountTo: opts.mountTo }),
      });
      return hwcClient as unknown as AppWebsocket;
    }

    if (RUNTIME === Runtime.Launcher) {
      return await AppWebsocket.connect({
        defaultTimeout: 60000,
      });
    }

    // Dev mode — direct admin/app websocket
    return await createClient();
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
