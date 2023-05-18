import {
  AppInfo,
  AdminWebsocket,
  CellType,
  AppAgentWebsocket,
} from "@holochain/client";
import WebSdkApi from "@holo-host/web-sdk";

export const HOLOCHAIN_APP_ID = "mewsfeed";
export const HOLOCHAIN_URL = `ws://localhost:${import.meta.env.VITE_HC_PORT}`;
export const IS_HOLO_HOSTED = Boolean(import.meta.env.VITE_IS_HOLO_HOSTED);

export const HOLO_CHAPERONE_URL = import.meta.env.VITE_CHAPERONE_SERVER_URL
  ? import.meta.env.VITE_CHAPERONE_SERVER_URL
  : "http://localhost:24274";

export const setupHolochain = async () => {
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
  try {
    const client = await WebSdkApi.connect({
      chaperoneUrl: HOLO_CHAPERONE_URL,
      authFormCustomization: {
        logoUrl: "assets/cat-eating-bird-circle.png",
        appName: "MewsFeed",
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
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { cell_id } = appInfo.cell_info.mewsfeed[0][CellType.Provisioned];
    const adminWs = await AdminWebsocket.connect(
      `ws://localhost:${import.meta.env.VITE_HC_ADMIN_PORT}`
    );
    await adminWs.authorizeSigningCredentials(cell_id);
    console.log("Holochain app client authorized for zome calls");
  }
};
