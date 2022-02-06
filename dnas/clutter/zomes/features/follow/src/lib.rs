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
pub fn follow(me: Follows, agent: AgentPubKeyB64) -> ExternResult<EntryHashB64> {
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
    
}
*/

/*
#[hdk_extern]
pub fn get_follows(path: Path) -> ExternResult<Follows> {
    path.ensure()?;
    
    
*/
