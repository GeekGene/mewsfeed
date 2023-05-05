import { useClientStore } from "@/stores/client";
import { ActionHash, AgentPubKey } from "@holochain/client";
import { Mew, FeedMew } from "../types/types";

export enum MewsFn {
  CreateMew = "create_mew",
  GetMew = "get_mew",
  MewsFeed = "get_my_followed_creators_mews_with_context",
  MewsBy = "get_agent_mews_with_context",
  GetFeedMewAndContext = "get_mew_with_context",
  GetMewsWithCashtag = "get_mews_for_cashtag_with_context",
  GetMewsWithHashtag = "get_mews_for_hashtag_with_context",
  GetMewsWithMention = "get_mews_for_mention_with_context",
  SearchTags = "search_tags",
}

export enum FollowsFn {
  Follow = "follow",
  Followers = "get_followers_for_creator",
  Following = "get_creators_for_follower",
  Unfollow = "unfollow",
}

export enum LikesFn {
  Like = "like",
  Unlike = "unlike",
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const callZome = (fn_name: string, payload: any, zome_name = "mews") =>
  useClientStore().callZome({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    role_name: "mewsfeed",
    zome_name,
    fn_name,
    payload,
  });

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
  callZome(LikesFn.Like, mew, "likes");

export const unlickMew = async (mew: ActionHash): Promise<null> =>
  callZome(LikesFn.Unlike, mew, "likes");

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

export const searchTags = async (query: string): Promise<string[]> =>
  callZome(MewsFn.SearchTags, { query, limit: 5 });
