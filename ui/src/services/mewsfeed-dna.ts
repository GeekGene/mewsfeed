import { useClientStore } from "@/stores";
import { MEWSFEED_ROLE_NAME, MEWS_ZOME_NAME } from "@/stores/mewsfeed";
import { ActionHash, AgentPubKey, CallZomeRequest } from "@holochain/client";
import { Mew, FeedMew } from "../types/types";

export enum MewsFn {
  CreateMew = "create_mew",
  GetMew = "get_mew",
  MewsFeed = "get_my_followed_creators_mews_with_context",
  MewsBy = "get_agent_mews_with_context",
  LickMew = "like_mew",
  UnlickMew = "unlike_mew",
  GetFeedMewAndContext = "get_mew_with_context",
  GetMewsWithCashtag = "get_mews_for_cashtag_with_context",
  GetMewsWithHashtag = "get_mews_for_hashtag_with_context",
  GetMewsWithMention = "get_mews_for_mention_with_context",
  SearchCashtags = "search_cashtags",
  SearchHashtags = "search_hashtags",
}

export enum FollowsFn {
  Follow = "follow",
  Followers = "get_followers_for_creator",
  Following = "get_creators_for_follower",
  Unfollow = "unfollow",
}

export const callZome = async <T>(
  fnName: CallZomeRequest["fn_name"],
  payload: CallZomeRequest["payload"],
  zomeName: string = MEWS_ZOME_NAME
) => {
  const result: { type: "ok"; data: T } = await useClientStore().callZome({
    roleName: MEWSFEED_ROLE_NAME,
    zomeName,
    fnName,
    payload,
  });
  return result.data;
};

export const createMew = async (mew: Mew) => callZome(MewsFn.CreateMew, mew);

export const getMew = async (mew: ActionHash): Promise<Mew> =>
  callZome(MewsFn.GetMew, mew);

export const mewsFeed = async (): Promise<Array<FeedMew>> =>
  callZome(MewsFn.MewsFeed, null);

export const mewsBy = async (agent: AgentPubKey): Promise<Array<FeedMew>> =>
  callZome(MewsFn.MewsBy, agent);

export const follow = async (agent: AgentPubKey): Promise<null> =>
  callZome(FollowsFn.Follow, agent, "follows");

export const unfollow = async (agent: AgentPubKey): Promise<null> =>
  callZome(FollowsFn.Unfollow, agent, "follows");

export const followers = async (
  agent: AgentPubKey
): Promise<Array<AgentPubKey>> =>
  callZome(FollowsFn.Followers, agent, "follows");

export const following = async (
  agent: AgentPubKey
): Promise<Array<AgentPubKey>> =>
  callZome(FollowsFn.Following, agent, "follows");

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
