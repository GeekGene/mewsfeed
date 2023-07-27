import {
  AppInfo,
  AdminWebsocket,
  CellType,
  AppAgentWebsocket,
} from "@holochain/client";
import WebSdkApi from "@holo-host/web-sdk";

export const HOLOCHAIN_APP_ID = "mewsfeed";
export const IS_HOLO_HOSTED = Boolean(import.meta.env.VITE_IS_HOLO_HOSTED);

export const setupHolochain = async () => {
  const HOLOCHAIN_URL = new URL(
    `ws://localhost:${import.meta.env.VITE_HC_PORT}`
  );

  try {
    const client = await AppAgentWebsocket.connect(
      HOLOCHAIN_URL,
      HOLOCHAIN_APP_ID,
      60000
    );

    if (typeof window === "object" && !("__HC_LAUNCHER_ENV__" in window)) {
      const appInfo = await client.appInfo();
      await authorizeClient(appInfo);
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

    return client;
  } catch (e) {
    console.log("Holo client setup error", e);
    throw e;
  }
};

// set up zome call signing when run outside of launcher
export const authorizeClient = async (appInfo: AppInfo) => {
  if (typeof window === "object" && !("__HC_LAUNCHER_ENV__" in window)) {
    if (!(CellType.Provisioned in appInfo.cell_info.mewsfeed[0])) {
      throw new Error("mewsfeed cell not provisioned");
    }
    const { cell_id } = appInfo.cell_info.mewsfeed[0][CellType.Provisioned];
    const adminWs = await AdminWebsocket.connect(
      new URL(`ws://localhost:${import.meta.env.VITE_HC_ADMIN_PORT}`)
    );
    await adminWs.authorizeSigningCredentials(cell_id);
    console.log("Holochain app client authorized for zome calls");
  }
};
