use hdk::prelude::*;
use hdk::prelude::holo_hash::*;

use::std::collections::BTreeMap;

use profiles::*;

entry_defs![PathEntry::entry_def()];

const FOLLOWERS_PATH_SEGMENT: &str = "followers";
const FOLLOWING_PATH_SEGMENT: &str = "following";

pub enum FollowFeatures {
    Follow,
    Unfollow,
    //Followed, // TODO: receive input about an agents action on you
    //Unfollowed
}

fn get_my_follows_base(base_type: &str, ensure: bool) -> ExternResult<EntryHashB64> {
    let me = agent_info()?.agent_latest_pubkey;
    get_follows_base(me.into(), base_type, ensure)
}

fn get_follows_base(agent: AgentPubKeyB64, base_type: &str, ensure: bool) -> ExternResult<EntryHashB64> {
    let path = Path::from(format!("agent.{}.{}", agent, base_type));
    if ensure {
        path.ensure()?;
    }
    let anchor_hash = path.path_entry_hash()?;
    Ok(anchor_hash)
}

#[hdk_extern]
pub fn follow(agent: AgentPubKeyB64) -> ExternResult<EntryHashB64> {
    let base = get_my_follows_base(FOLLOWING_PATH_SEGMENT, true)?; 
    let target = get_follows_base(agent, FOLLOWING_PATH_SEGMENT, false)?;
    let follow = Path::from(format!("follows.{}.{}", base, target));
    follow.ensure()?;
    let link = create_link(base, target, FOLLOWERS_PATH_SEGMENT)?;

    let path_hash = follow.path_entry_hash()?;
    Ok(path_hash)
}

/*
#[hdk_extern]
pub fn unfollow(agent: AgentPubKeyB64) -> {
    // TODO: remove link
}
*/

#[hdk_extern]
pub fn my_following(_: ()) -> ExternResult<Vec<AgentPubKeyB64>> {
    let me: AgentPubKeyB64 = agent_info()?.agent_latest_pubkey.into();
    follow_inner(me, FOLLOWING_PATH_SEGMENT)
}
#[hdk_extern]
pub fn my_followers(_: ()) -> ExternResult<Vec<AgentPubKeyB64>> {
    let me: AgentPubKeyB64 = agent_info()?.agent_latest_pubkey.into();
    follow_inner(me, FOLLOWERS_PATH_SEGMENT)
}

fn follow_inner(agent: AgentPubKeyB64, base_type: &str) -> ExternResult<Vec<AgentPubKeyB64>> {
    let base = get_mews_base(agent, base_type, false)?;
    let links = get_links(base, None)?;
    Ok(links
        .into_iter()
        .map(|link| AgentPubKey::from(link.target).into())
        .collect())
}