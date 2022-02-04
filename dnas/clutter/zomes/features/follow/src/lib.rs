use hdk::prelude::*;
use hdk::prelude::holo_hash::*;

entry_defs![Path::entry_def()];

#[derive(Debug, Clone)]
pub struct Follows { //lists associated Nickname with AgentPubKey
    pub following: Vec<(AgentPubKeyB64, &str)>,
    pub followers: Vec<(AgentPubKeyB64, &str)>,
}

#[derive(Debug)]
pub enum FollowFeatures {
    Follow,
    Unfollow,
    //Followed, // TODO: receive input about an agents action on you
    //Unfollowed
}

pub fn update_follows(agent_follows: Follows, action: FollowFeatures, me: bool) -> Follows {
    if me {
    match action {
        Follow => agent_follows.following.push,
        Unfollow => agent_follows.following.pop[agent], // TODO: assign agent to location number or could use BTreeMap
        }
        }
    else {
    match action {
        Follow => agent_follows.followers.push,
        Unfollow => agent_follows.followers.pop[agent],
        }
    }
    agent_follows  
}

#[hdk_extern]
pub fn follow(me: Follows, agent: AgentPubKeyB64) -> ExternResult<Path> {
    let base: AgentPubKeyB64 = agent_info()?.agent_latest_pubkey; 
    let target: AgentPubKeyB64 = agent;
    let follow = Path::from(format!("follows.{}.{}", base, target));
    follow.ensure?;
    update_follows(me, Follow, true);
    Ok(follow)
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
