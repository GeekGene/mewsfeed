import { useClientStore } from "@/stores";
import { CLUTTER_ROLE_NAME, MEWS_ZOME_NAME } from "@/stores/clutter";
import { AgentPubKeyB64 } from "@holochain-open-dev/core-types";
import { deserializeHash } from "@holochain-open-dev/utils";
import { ActionHash, AgentPubKey, CallZomeRequest } from "@holochain/client";
import {
  CreateMewInput,
  FeedMew,
  FeedMewsInRecentTimePeriods,
  FeedOptions,
  GetRecentMewsInput,
  Mew,
  TopMewsInteractions,
} from "../types/types";

export enum MewsFn {
  CreateMew = "create_mew",
  GetMew = "get_mew",
  MewsFeed = "mews_feed",
  MewsBy = "mews_by",
  MewsMostLicked = "mews_most_licked",
  MewsMostMewmewed = "mews_most_mewmewed",
  MewsMostReplied = "mews_most_replied",
  MewsMostQuoted = "mews_most_quoted",
  Follow = "follow",
  Followers = "followers",
  Following = "following",
  MyFollowers = "my_followers",
  MyFollowing = "my_following",
  Unfollow = "unfollow",
  LickMew = "lick_mew",
  UnlickMew = "unlick_mew",
  MyLicks = "my_licks",
  GetFeedMewAndContext = "get_feed_mew_and_context",
  GetMewsWithCashtag = "get_mews_with_cashtag",
  GetMewsWithHashtag = "get_mews_with_hashtag",
  GetMewsWithMention = "get_mews_with_mention",
  SearchCashtags = "search_cashtags",
  SearchHashtags = "search_hashtags",
}

export const callZome = async <T>(
  fnName: CallZomeRequest["fn_name"],
  payload: CallZomeRequest["payload"]
) => {
  const result: { type: "ok"; data: T } = await useClientStore().callZome({
    roleName: CLUTTER_ROLE_NAME,
    zomeName: MEWS_ZOME_NAME,
    fnName,
    payload,
  });
  return result.data;
};

export const createMew = async (mew: CreateMewInput) =>
  callZome(MewsFn.CreateMew, mew);

export const getMew = async (mew: ActionHash): Promise<Mew> =>
  callZome(MewsFn.GetMew, mew);

export const mewsFeed = async (options: FeedOptions): Promise<Array<FeedMew>> =>
  callZome(MewsFn.MewsFeed, options);

export const mewsBy = async (
  agent: AgentPubKey | AgentPubKeyB64
): Promise<Array<FeedMew>> =>
  callZome(
    MewsFn.MewsBy,
    typeof agent === "string" ? deserializeHash(agent) : agent
  );

export const mewsTopList = async (
  interaction: TopMewsInteractions,
  input: GetRecentMewsInput
): Promise<FeedMewsInRecentTimePeriods> => {
  if (interaction === "licks") {
    return callZome(MewsFn.MewsMostLicked, input);
  } else if (interaction === "mewmews") {
    return callZome(MewsFn.MewsMostMewmewed, input);
  } else if (interaction === "quotes") {
    return callZome(MewsFn.MewsMostQuoted, input);
  } else if (interaction === "replies") {
    return callZome(MewsFn.MewsMostReplied, input);
  } else {
    throw Error("Interaction type must be defined");
  }
};

export const follow = async (agent: AgentPubKey): Promise<null> =>
  callZome(MewsFn.Follow, agent);

export const unfollow = async (agent: AgentPubKey): Promise<null> =>
  callZome(MewsFn.Unfollow, agent);

export const followers = async (
  agent: AgentPubKey
): Promise<Array<AgentPubKey>> => callZome(MewsFn.Followers, agent);

export const following = async (
  agent: AgentPubKey
): Promise<Array<AgentPubKey>> => callZome(MewsFn.Following, agent);

export const myFollowers = async (): Promise<Array<AgentPubKey>> =>
  callZome(MewsFn.MyFollowers, null);

export const myFollowing = async (): Promise<Array<AgentPubKey>> =>
  callZome(MewsFn.MyFollowing, null);

export const lickMew = async (mew: ActionHash): Promise<null> =>
  callZome(MewsFn.LickMew, mew);

export const unlickMew = async (mew: ActionHash): Promise<null> =>
  callZome(MewsFn.UnlickMew, mew);

export const getFeedMewAndContext = async (
  mew_action_hash: ActionHash
): Promise<FeedMew> => callZome(MewsFn.GetFeedMewAndContext, mew_action_hash);

export const getMewsWithCashtag = async (cashtag: string): Promise<FeedMew[]> =>
  callZome(MewsFn.GetMewsWithCashtag, cashtag);

export const getMewsWithHashtag = async (hashtag: string): Promise<FeedMew[]> =>
  callZome(MewsFn.GetMewsWithHashtag, hashtag);

export const getMewsWithMention = async (
  agentPubKey: AgentPubKey
): Promise<FeedMew[]> => callZome(MewsFn.GetMewsWithMention, agentPubKey);

export const searchCashtags = async (query: string): Promise<string[]> =>
  callZome(MewsFn.SearchCashtags, query);

export const searchHashtags = async (query: string): Promise<string[]> =>
  callZome(MewsFn.SearchHashtags, query);
