import {
  AppWebsocket,
  CallZomeRequest,
  InstalledAppInfo,
  InstalledCell,
} from "@holochain/client";
import { inject, InjectionKey } from "vue";
import { Mew, FeedOptions, FeedMew, FullMew } from "../types/types";
import { EntryHashB64, AgentPubKeyB64 } from '@holochain-open-dev/core-types';

let appWebSocket: AppWebsocket;
let appInfo: InstalledAppInfo;

export let clutterCell: InstalledCell;

export const APP_WEB_SOCKET: InjectionKey<AppWebsocket> = Symbol();
export const connectAppWebSocket = async () => {
  if (!appWebSocket) {
    appWebSocket = await AppWebsocket.connect(
      `ws://localhost:${import.meta.env.VITE_HC_PORT}`
    );
    appInfo = await appWebSocket.appInfo({ installed_app_id: "clutter" });
    const cell = appInfo.cell_data.find((cell) => cell.role_id === "clutter");
    if (!cell) {
      throw new Error('Could not find cell "clutter"');
    }
    clutterCell = cell;
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

const callZome = async (
  req: Pick<CallZomeRequest, "zome_name" | "fn_name" | "payload">
) => {
  const provenance = clutterCell.cell_id[1];
  return appWebSocket.callZome({
    cell_id: clutterCell.cell_id,
    zome_name: req.zome_name,
    fn_name: req.fn_name,
    payload: req.payload,
    cap_secret: null,
    provenance,
  });
};

export const createMew = async (mew: Mew) => {
  return callZome({
    zome_name: "mews",
    fn_name: "create_mew",
    payload: mew,
  });
};

export const getMew = async (mew: EntryHashB64) : Promise<FullMew> => {
  return callZome({
    zome_name: "mews",
    fn_name: "get_mew",
    payload: mew,
  });
};

export const mewsFeed = async (options: FeedOptions) : Promise<Array<FeedMew>> => {
  return callZome({
    zome_name: "mews",
    fn_name: "mews_feed",
    payload: options,
  });
};

export const mewsBy = async (agent: AgentPubKeyB64) : Promise<Array<FeedMew>> => {
  return callZome({
    zome_name: "mews",
    fn_name: "mews_by",
    payload: agent,
  });
};

export const follow = async (agent: AgentPubKeyB64) : Promise<Array<AgentPubKeyB64>> => {
  return callZome({
    zome_name: "mews",
    fn_name: "follow",
    payload: agent,
  });
};

export const followers = async (agent: AgentPubKeyB64) : Promise<Array<AgentPubKeyB64>> => {
  return callZome({
    zome_name: "mews",
    fn_name: "followers",
    payload: agent,
  });
};

export const following = async (agent: AgentPubKeyB64) : Promise<Array<AgentPubKeyB64>> => {
  return callZome({
    zome_name: "mews",
    fn_name: "following",
    payload: agent,
  });
};

export const myFollowers = async () : Promise<Array<AgentPubKeyB64>> => {
  return callZome({
    zome_name: "mews",
    fn_name: "my_followers",
    payload: null,
  });
};

export const myFollowing = async () : Promise<Array<AgentPubKeyB64>> => {
  return callZome({
    zome_name: "mews",
    fn_name: "my_following",
    payload: null,
  });
};
