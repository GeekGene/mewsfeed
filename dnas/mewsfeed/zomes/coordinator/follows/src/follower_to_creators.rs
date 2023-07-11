use follows_integrity::*;
use follows_types::*;
use hc_link_pagination::paginate_by_agentpubkey;
use hdk::prelude::*;

#[hdk_extern]
pub fn add_creator_for_follower(input: AddCreatorForFollowerInput) -> ExternResult<()> {
    create_link(
        input.base_follower.clone(),
        input.target_creator.clone(),
        LinkTypes::FollowerToCreators,
        (),
    )?;
    create_link(
        input.target_creator,
        input.base_follower,
        LinkTypes::CreatorToFollowers,
        (),
    )?;

    Ok(())
}

#[hdk_extern]
pub fn get_creators_for_follower(
    input: GetCreatorsForFollowerInput,
) -> ExternResult<Vec<AgentPubKey>> {
    let links = get_links(input.follower, LinkTypes::FollowerToCreators, None)?;
    let links_page = paginate_by_agentpubkey(links, input.page)?;

    let agents: Vec<AgentPubKey> = links_page
        .into_iter()
        .filter_map(|link| EntryHash::try_from(link.target).ok())
        .map(|entry_hash| AgentPubKey::from(entry_hash))
        .collect();

    Ok(agents)
}

#[hdk_extern]
pub fn get_followers_for_creator(
    input: GetFollowersForCreatorInput,
) -> ExternResult<Vec<AgentPubKey>> {
    let links = get_follower_links_for_creator(input)?;

    let agents: Vec<AgentPubKey> = links
        .into_iter()
        .filter_map(|link| EntryHash::try_from(link.target).ok())
        .map(|entry_hash| AgentPubKey::from(entry_hash))
        .collect();

    Ok(agents)
}

#[hdk_extern]
pub fn get_follower_links_for_creator(
    input: GetFollowersForCreatorInput,
) -> ExternResult<Vec<Link>> {
    let mut links = get_links(input.creator, LinkTypes::CreatorToFollowers, None)?;
    links.dedup_by_key(|l| l.target.clone());
    let links_page = paginate_by_agentpubkey(links, input.page)?;

    Ok(links_page)
}

#[hdk_extern]
pub fn get_follower_link_details_for_creator(creator: AgentPubKey) -> ExternResult<LinkDetails> {
    let links = get_link_details(creator, LinkTypes::CreatorToFollowers, None)?;

    Ok(links)
}

#[hdk_extern]
pub fn remove_creator_for_follower(input: RemoveCreatorForFollowerInput) -> ExternResult<()> {
    let links = get_links(
        input.base_follower.clone(),
        LinkTypes::FollowerToCreators,
        None,
    )?;

    for link in links {
        let entry_hash =
            EntryHash::try_from(link.target.clone()).map_err(|err| wasm_error!(err))?;
        if AgentPubKey::from(entry_hash).eq(&input.target_creator) {
            delete_link(link.create_link_hash)?;
        }
    }

    let links = get_links(
        input.target_creator.clone(),
        LinkTypes::CreatorToFollowers,
        None,
    )?;

    for link in links {
        let entry_hash =
            EntryHash::try_from(link.target.clone()).map_err(|err| wasm_error!(err))?;
        if AgentPubKey::from(entry_hash).eq(&input.base_follower) {
            delete_link(link.create_link_hash)?;
        }
    }

    Ok(())
}

#[hdk_extern]
pub fn follow(agent: AgentPubKey) -> ExternResult<()> {
    add_creator_for_follower(AddCreatorForFollowerInput {
        base_follower: agent_info()?.agent_initial_pubkey,
        target_creator: agent,
    })
}

#[hdk_extern]
pub fn unfollow(agent: AgentPubKey) -> ExternResult<()> {
    remove_creator_for_follower(RemoveCreatorForFollowerInput {
        base_follower: agent_info()?.agent_initial_pubkey,
        target_creator: agent,
    })
}
