import { Injectable } from '@angular/core';
//
import { AgentPubKeyB64 } from '@holochain-open-dev/core-types';
import { deserializeHash } from '@holochain-open-dev/utils';
import { ActionHash, AgentPubKey, CallZomeRequest } from '@holochain/client';
import { from, Observable } from 'rxjs';
import { CreateMewInput, FeedMew, FeedOptions, Mew } from '../types/types';
import { HolochainService } from './holochain.service';
//
export const NATIVE_INSTALLED_APP_ID = 'clutter';
export const CLUTTER_ROLE_ID = 'clutter';
export const MEWS_ZOME_NAME = 'mews';
//
export enum MewsFn {
  CreateMew = 'create_mew',
  GetMew = 'get_mew',
  MewsFeed = 'mews_feed',
  MewsBy = 'mews_by',
  Follow = 'follow',
  Followers = 'followers',
  Following = 'following',
  MyFollowers = 'my_followers',
  MyFollowing = 'my_following',
  Unfollow = 'unfollow',
  LickMew = 'lick_mew',
  UnlickMew = 'unlick_mew',
  MyLicks = 'my_licks',
  GetFeedMewAndContext = 'get_feed_mew_and_context',
  GetMewsWithCashtag = 'get_mews_with_cashtag',
  GetMewsWithHashtag = 'get_mews_with_hashtag',
  GetMewsWithMention = 'get_mews_with_mention',
}

@Injectable({
  providedIn: 'root',
})
export class ClutterDnaService {
  constructor(private holochainService: HolochainService) {}

  callClutterZomeObs<T>(
    fnName: CallZomeRequest["fn_name"],
    payload: CallZomeRequest["payload"]
  ): Observable<T> {
    return from(this.callClutterZome<T>(fnName, payload));
    // );.pipe(catchError(this.handleError<T>(fnName, [])));
  }

  async callClutterZome<T>(
    fnName: CallZomeRequest["fn_name"],
    payload: CallZomeRequest["payload"]
  ): Promise<T> {
    const result: { type: 'ok'; data: T } =
      await this.holochainService.callZome({
        roleId: CLUTTER_ROLE_ID,
        zomeName: MEWS_ZOME_NAME,
        fnName,
        payload,
      });
    console.log('🚀 ~ ClutterDnaService ~ result', result);

    return result.data;
  }

  // mew create / get / get by
  createMew = async (mew: CreateMewInput) =>
    this.callClutterZome(MewsFn.CreateMew, mew);

  getMew = async (mew: ActionHash): Promise<Mew> =>
    this.callClutterZome(MewsFn.GetMew, mew);

  mewsBy = async (
    agent: AgentPubKey | AgentPubKeyB64
  ): Promise<Array<FeedMew>> =>
    this.callClutterZome(
      MewsFn.MewsBy,
      typeof agent === 'string' ? deserializeHash(agent) : agent
    );

  // actions follow, like

  follow = async (agent: AgentPubKey): Promise<null> =>
    this.callClutterZome(MewsFn.Follow, agent);

  unfollow = async (agent: AgentPubKey): Promise<null> =>
    this.callClutterZome(MewsFn.Unfollow, agent);

  followers = async (agent: AgentPubKey): Promise<Array<AgentPubKey>> =>
    this.callClutterZome(MewsFn.Followers, agent);

  following = async (agent: AgentPubKey): Promise<Array<AgentPubKey>> =>
    this.callClutterZome(MewsFn.Following, agent);

  myFollowers = async (): Promise<Array<AgentPubKey>> =>
    this.callClutterZome(MewsFn.MyFollowers, null);

  myFollowing = async (): Promise<Array<AgentPubKey>> =>
    this.callClutterZome(MewsFn.MyFollowing, null);

  lickMew = async (mew: ActionHash): Promise<null> =>
    this.callClutterZome(MewsFn.LickMew, mew);

  unlickMew = async (mew: ActionHash): Promise<null> =>
    this.callClutterZome(MewsFn.UnlickMew, mew);

  // feed and list

  mewsFeed = async (options: FeedOptions): Promise<Array<FeedMew>> =>
    this.callClutterZome(MewsFn.MewsFeed, options);

  getFeedMewAndContext = async (
    mew_action_hash: ActionHash
  ): Promise<FeedMew> =>
    this.callClutterZome(MewsFn.GetFeedMewAndContext, mew_action_hash);

  getMewsWithCashtag = async (cashtag: string): Promise<FeedMew[]> =>
    this.callClutterZome(MewsFn.GetMewsWithCashtag, cashtag);

  getMewsWithHashtag = async (hashtag: string): Promise<FeedMew[]> =>
    this.callClutterZome(MewsFn.GetMewsWithHashtag, hashtag);

  getMewsWithMention = async (agentPubKey: AgentPubKey): Promise<FeedMew[]> =>
    this.callClutterZome(MewsFn.GetMewsWithMention, agentPubKey);


}
