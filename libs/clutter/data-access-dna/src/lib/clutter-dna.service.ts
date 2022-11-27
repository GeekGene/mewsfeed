import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
//
import { AgentPubKeyB64 } from '@holochain-open-dev/core-types';
import { deserializeHash } from '@holochain-open-dev/utils';
import { ActionHash, AgentPubKey, CallZomeRequest } from '@holochain/client';
//
import { CreateMewInput, FeedMew, FeedOptions, Mew, MewsFn } from './clutter-dna.types';
import { HolochainService } from '@shared/util-holochain';
//
export const CLUTTER_ROLE_ID = 'clutter';
export const MEWS_ZOME_NAME = 'mews';
//
@Injectable({
  providedIn: 'root',
})
export class ClutterDnaService {
  constructor(private holochainService: HolochainService) {}

  callClutterZomeObs<T>(
    fnName: CallZomeRequest['fn_name'],
    payload: CallZomeRequest['payload']
  ): Observable<T> {
    return from(this.callClutterZome<T>(fnName, payload));
    // );.pipe(catchError(this.handleError<T>(fnName, [])));
  }

  async callClutterZome<T>(
    fnName: CallZomeRequest['fn_name'],
    payload: CallZomeRequest['payload']
  ): Promise<T> {
    const result: T = // { type: 'ok'; data: T } =
      await this.holochainService.callZome({
        roleId: CLUTTER_ROLE_ID,
        zomeName: MEWS_ZOME_NAME,
        fnName,
        payload,
      });
    return result;
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
    this.callClutterZome<null>(MewsFn.Follow, agent);

  unfollow = async (agent: AgentPubKey): Promise<null> =>
    this.callClutterZome<null>(MewsFn.Unfollow, agent);

  followers = async (agent: AgentPubKey): Promise<AgentPubKey[]> =>
    this.callClutterZome<AgentPubKey[]>(MewsFn.Followers, agent);

  following = async (agent: AgentPubKey): Promise<AgentPubKey[]> =>
    this.callClutterZome<AgentPubKey[]>(MewsFn.Following, agent);

  myFollowers = async (): Promise<AgentPubKey[]> =>
    this.callClutterZome<AgentPubKey[]>(MewsFn.MyFollowers, null);

  myFollowing = async (): Promise<AgentPubKey[]> =>
    this.callClutterZome<AgentPubKey[]>(MewsFn.MyFollowing, null);

  lickMew = async (mew: ActionHash): Promise<null> =>
    this.callClutterZome<null>(MewsFn.LickMew, mew);

  unlickMew = async (mew: ActionHash): Promise<null> =>
    this.callClutterZome<null>(MewsFn.UnlickMew, mew);

  // feed and list

  mewsFeed = async (options: FeedOptions): Promise<FeedMew[]> =>
    this.callClutterZome<FeedMew[]>(MewsFn.MewsFeed, options);

  getFeedMewAndContext = async (
    mew_action_hash: ActionHash
  ): Promise<FeedMew> =>
    this.callClutterZome<FeedMew>(MewsFn.GetFeedMewAndContext, mew_action_hash);

  getMewsWithCashtag = async (cashtag: string): Promise<FeedMew[]> =>
    this.callClutterZome<FeedMew[]>(MewsFn.GetMewsWithCashtag, cashtag);

  getMewsWithHashtag = async (hashtag: string): Promise<FeedMew[]> =>
    this.callClutterZome<FeedMew[]>(MewsFn.GetMewsWithHashtag, hashtag);

  getMewsWithMention = async (agentPubKey: AgentPubKey): Promise<FeedMew[]> =>
    this.callClutterZome<FeedMew[]>(MewsFn.GetMewsWithMention, agentPubKey);
}
