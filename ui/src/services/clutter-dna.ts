import { AppWebsocket, CallZomeRequest, InstalledAppInfo } from "@holochain/client";
import { inject, InjectionKey } from "vue";
import { Profile } from "../types/types";

let appWebSocket: AppWebsocket;
let appInfo: InstalledAppInfo;

export const APP_WEB_SOCKET: InjectionKey<AppWebsocket> = Symbol();
export const connectAppWebSocket = async () => {
    if (!appWebSocket) {
        appWebSocket = await AppWebsocket.connect(`ws://localhost:${import.meta.env.VITE_HC_PORT}`);
        appInfo = await appWebSocket.appInfo({ installed_app_id: "clutter" });
    }
    return appWebSocket;
};

export const useAppWebSocket = () => {
    const injected = inject(APP_WEB_SOCKET);
    if (!injected) {
        throw new Error("App WebSocket has not been initialized");
    }
    return injected;
};

const callZome = async (req: Pick<CallZomeRequest, "zome_name" | "fn_name" | "payload">) => {
    const cell = appInfo.cell_data.find((cell) => cell.role_id === "clutter");
    if (!cell) {
        throw new Error("Could not find cell \"clutter\"");
    }
    const provenance = cell.cell_id[1];
    return appWebSocket.callZome({
        cell_id: cell.cell_id,
        zome_name: req.zome_name,
        fn_name: req.fn_name,
        payload: req.payload,
        cap_secret: null,
        provenance
    });
};

export const createProfile = async (profile: Profile) => {
    return callZome({
        zome_name: "profiles_stub",
        fn_name: "create_profile",
        payload: profile
    });
};
