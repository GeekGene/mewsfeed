use hdk::prelude::*;
use follows_integrity::*;

#[derive(Serialize, Deserialize, Debug)]
pub struct AddFolloweeForFollowerInput {
    pub base_follower: AgentPubKey,
    pub target_followee: AgentPubKey,
}
#[hdk_extern]
pub fn add_followee_for_follower(input: AddFolloweeForFollowerInput) -> ExternResult<()> {
    create_link(input.base_follower.clone(), input.target_followee.clone(), LinkTypes::FollowerToFollowees, ())?;
    create_link(input.target_followee, input.base_follower, LinkTypes::FolloweeToFollowers, ())?;

    Ok(())    
}

#[hdk_extern]
pub fn get_followees_for_follower(follower: AgentPubKey) -> ExternResult<Vec<AgentPubKey>> {
    let links = get_links(follower, LinkTypes::FollowerToFollowees, None)?;
    
    let agents: Vec<AgentPubKey> = links
        .into_iter()
        .map(|link| AgentPubKey::from(EntryHash::from(link.target)))
        .collect();

    Ok(agents)
}


#[hdk_extern]
pub fn get_followers_for_followee(followee: AgentPubKey) -> ExternResult<Vec<AgentPubKey>> {
    let links = get_links(followee, LinkTypes::FolloweeToFollowers, None)?;
    
    let agents: Vec<AgentPubKey> = links
        .into_iter()
        .map(|link| AgentPubKey::from(EntryHash::from(link.target)))
        .collect();

    Ok(agents)
}
        
#[derive(Serialize, Deserialize, Debug)]
pub struct RemoveFolloweeForFollowerInput {
    pub base_follower: AgentPubKey,
    pub target_followee: AgentPubKey,
}
#[hdk_extern]
pub fn remove_followee_for_follower(input: RemoveFolloweeForFollowerInput ) -> ExternResult<()> {
    let links = get_links(input.base_follower.clone(), LinkTypes::FollowerToFollowees, None)?;
    
    for link in links {
        if AgentPubKey::from(EntryHash::from(link.target.clone())).eq(&input.target_followee) {
            delete_link(link.create_link_hash)?;
        }
    }
    
    let links = get_links(input.target_followee.clone(), LinkTypes::FolloweeToFollowers, None)?;

    for link in links {
        if AgentPubKey::from(EntryHash::from(link.target.clone())).eq(&input.base_follower) {
            delete_link(link.create_link_hash)?;
        }
    }

    Ok(())        
}
#[hdk_extern]
pub fn follow(agent: AgentPubKey) -> ExternResult<()> {
    add_followee_for_follower(AddFolloweeForFollowerInput {base_follower: agent_info()?.agent_initial_pubkey, target_followee: agent})
}
#[hdk_extern]
pub fn unfollow(agent: AgentPubKey) -> ExternResult<()> {
    remove_followee_for_follower(RemoveFolloweeForFollowerInput {base_follower: agent_info()?.agent_initial_pubkey, target_followee: agent})
}
