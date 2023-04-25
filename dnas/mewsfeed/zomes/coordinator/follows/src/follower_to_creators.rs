use hdk::prelude::*;
use follows_integrity::*;

#[derive(Serialize, Deserialize, Debug)]
pub struct AddCreatorForFollowerInput {
    pub base_follower: AgentPubKey,
    pub target_creator: AgentPubKey,
}
#[hdk_extern]
pub fn add_creator_for_follower(input: AddCreatorForFollowerInput) -> ExternResult<()> {
    create_link(input.base_follower.clone(), input.target_creator.clone(), LinkTypes::FollowerToCreators, ())?;
    create_link(input.target_creator, input.base_follower, LinkTypes::CreatorToFollowers, ())?;

    Ok(())    
}

#[hdk_extern]
pub fn get_creators_for_follower(follower: AgentPubKey) -> ExternResult<Vec<AgentPubKey>> {
    let links = get_links(follower, LinkTypes::FollowerToCreators, None)?;
    
    let agents: Vec<AgentPubKey> = links
        .into_iter()
        .map(|link| AgentPubKey::from(EntryHash::from(link.target)))
        .collect();

    Ok(agents)
}


#[hdk_extern]
pub fn get_followers_for_creator(creator: AgentPubKey) -> ExternResult<Vec<AgentPubKey>> {
    let links = get_links(creator, LinkTypes::CreatorToFollowers, None)?;
    
    let agents: Vec<AgentPubKey> = links
        .into_iter()
        .map(|link| AgentPubKey::from(EntryHash::from(link.target)))
        .collect();

    Ok(agents)
}
        
#[derive(Serialize, Deserialize, Debug)]
pub struct RemoveCreatorForFollowerInput {
    pub base_follower: AgentPubKey,
    pub target_creator: AgentPubKey,
}
#[hdk_extern]
pub fn remove_creator_for_follower(input: RemoveCreatorForFollowerInput ) -> ExternResult<()> {
    let links = get_links(input.base_follower.clone(), LinkTypes::FollowerToCreators, None)?;
    
    for link in links {
        if AgentPubKey::from(EntryHash::from(link.target.clone())).eq(&input.target_creator) {
            delete_link(link.create_link_hash)?;
        }
    }
    
    let links = get_links(input.target_creator.clone(), LinkTypes::CreatorToFollowers, None)?;

    for link in links {
        if AgentPubKey::from(EntryHash::from(link.target.clone())).eq(&input.base_follower) {
            delete_link(link.create_link_hash)?;
        }
    }

    Ok(())        
}
#[hdk_extern]
pub fn follow(agent: AgentPubKey) -> ExternResult<()> {
    add_creator_for_follower(AddCreatorForFollowerInput { base_follower: agent_info()?.agent_initial_pubkey, target_creator: agent })
}
#[hdk_extern]
pub fn unfollow(agent: AgentPubKey) -> ExternResult<()> {
    remove_creator_for_follower(RemoveCreatorForFollowerInput { base_follower: agent_info()?.agent_initial_pubkey, target_creator: agent })
}
#[hdk_extern]
pub fn get_my_followers(_: ()) -> ExternResult<Vec<AgentPubKey>> {
    get_followers_for_creator(agent_info()?.agent_initial_pubkey)
}
#[hdk_extern]
pub fn get_my_creators(_: ()) -> ExternResult<Vec<AgentPubKey>> {
    get_creators_for_follower(agent_info()?.agent_initial_pubkey)
}
