import {
  AppInfo,
  AdminWebsocket,
  CellType,
  AppAgentWebsocket,
} from "@holochain/client";
import WebSdkApi, { AgentState } from "@holo-host/web-sdk";

export const HOLOCHAIN_APP_ID = "mewsfeed";
export const IS_LAUNCHER = import.meta.env.VITE_IS_LAUNCHER;
export const IS_HOLO_HOSTED = import.meta.env.VITE_IS_HOLO_HOSTED;

export const setupHolochain = async () => {
  try {
    const adminWs = await AdminWebsocket.connect(
      new URL(`ws://localhost:${import.meta.env.VITE_HC_ADMIN_PORT}`)
    );
    let agentKey;
    let appInfo;
    let port;
    const installedApps = await adminWs.listApps({});
    if (installedApps.length === 0) {
      console.log("generating agent key");
      agentKey = await adminWs.generateAgentPubKey();
      console.log("installing mewsfeed app");
      appInfo = await adminWs.installApp({
        agent_key: agentKey,
        path: "/Users/jost/Desktop/holochain/mewsfeed/workdir/mewsfeed.happ",
        membrane_proofs: {},
      });
      console.log("installed", appInfo);
      await adminWs.enableApp({ installed_app_id: appInfo.installed_app_id });
      console.log("app enabled");
    } else {
      appInfo = installedApps[0];
    }
    const appInterfaces = await adminWs.listAppInterfaces();
    console.log("appi interfaces", appInterfaces);
    if (appInterfaces.length === 0) {
      port = (await adminWs.attachAppInterface({})).port;
    } else {
      port = appInterfaces[0];
    }
    console.log("port is", port);

    if (!(CellType.Provisioned in appInfo.cell_info.mewsfeed[0])) {
      throw new Error("mewsfeed cell not provisioned");
    }
    const { cell_id } = appInfo.cell_info.mewsfeed[0][CellType.Provisioned];
    await adminWs.authorizeSigningCredentials(cell_id);

    const client = await AppAgentWebsocket.connect(
      // IS_LAUNCHER
      //   ? new URL(`ws://UNUSED`)
      new URL(`ws://localhost:${port}`),
      HOLOCHAIN_APP_ID,
      60000
    );

    // if (typeof window === "object" && !("__HC_LAUNCHER_ENV__" in window)) {
    //   const appInfo = await client.appInfo();
    //   await authorizeClient(appInfo);
    // }

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
