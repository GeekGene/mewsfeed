import { AppWebsocket } from "@holochain/client";
import { InjectionKey } from "vue";

export const APP_WEB_SOCKET: InjectionKey<AppWebsocket> = Symbol();

let appWebSocket: AppWebsocket

export class AppWs {
    private constructor() { }

    static async connect() {
        if (!appWebSocket) {
            appWebSocket = await AppWebsocket.connect(`ws://localhost:53427`) //${import.meta.env.VITE_HC_PORT}`)
        }
        return appWebSocket;
    }

    // const appInfo = await ws.appInfo({installed_app_id: 'test-app'})
    // const cell = appInfo.cell_data.find((cell) => cell.role_id === 'clutter');
    // if (!cell) {
    //     return
    // }
}

export const useAppWebSocket = () => {
    if (!appWebSocket) {
        throw new Error('AppWebSocket has not been initialized')
    }
    return appWebSocket;
}
