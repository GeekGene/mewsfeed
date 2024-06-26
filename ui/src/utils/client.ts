import { AdminWebsocket, CellType, AppWebsocket } from "@holochain/client";
import WebSdkApi, { AgentState } from "@holo-host/web-sdk";

export const HOLOCHAIN_APP_ID = "mewsfeed";
export const IS_LAUNCHER = import.meta.env.VITE_IS_LAUNCHER;
export const IS_HOLO_HOSTED = import.meta.env.VITE_IS_HOLO_HOSTED;

export const setupHolochain = async () => {
  try {
    let client;
    if (typeof window === "object" && !("__HC_LAUNCHER_ENV__" in window)) {
      client = await createClient();
    } else {
      const url = IS_LAUNCHER
        ? new URL(`ws://UNUSED`)
        : new URL(`ws://localhost:${import.meta.env.VITE_HC_PORT}`);
      console.log("url", url);
      client = await AppWebsocket.connect({
        url,
        defaultTimeout: 60000,
      });
      console.log("client", client);
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
  if (
    !client.cachedAppInfo ||
    !(CellType.Provisioned in client.cachedAppInfo.cell_info.mewsfeed[0])
  ) {
    throw new Error("mewsfeed cell not provisioned");
  }
  const { cell_id } =
    client.cachedAppInfo.cell_info.mewsfeed[0][CellType.Provisioned];
  await adminWs.authorizeSigningCredentials(cell_id);
  return client;
};
