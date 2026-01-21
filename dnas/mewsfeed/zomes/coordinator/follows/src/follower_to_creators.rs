use follows_integrity::*;
use follows_types::*;
use hc_link_pagination::paginate_by_agentpubkey;
use hc_zome_input::ZomeFnInput;
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
    input: ZomeFnInput<GetCreatorsForFollowerInput>,
) -> ExternResult<Vec<AgentPubKey>> {
    let strategy = input.get_strategy();
    let links = get_links(
        LinkQuery::new(
            AnyLinkableHash::from(input.input.follower.clone()),
            LinkTypes::FollowerToCreators.try_into_filter()?,
        ),
        strategy,
    )?;

    let links_page = paginate_by_agentpubkey(links, input.input.page)?;

    let agents: Vec<AgentPubKey> = links_page
        .into_iter()
        .filter_map(|link| EntryHash::try_from(link.target).ok())
        .map(AgentPubKey::from)
        .collect();

    Ok(agents)
}

#[hdk_extern]
pub fn get_followers_for_creator(
    input: ZomeFnInput<GetFollowersForCreatorInput>,
) -> ExternResult<Vec<AgentPubKey>> {
    let links = get_follower_links_for_creator(input)?;

    let agents: Vec<AgentPubKey> = links
        .into_iter()
        .filter_map(|link| EntryHash::try_from(link.target).ok())
        .map(AgentPubKey::from)
        .collect();

    Ok(agents)
}

#[hdk_extern]
pub fn count_creators_for_follower(input: ZomeFnInput<AgentPubKey>) -> ExternResult<usize> {
    count_links(LinkQuery::new(
        input.input,
        LinkTypes::FollowerToCreators.try_into_filter()?,
    ))
}

#[hdk_extern]
pub fn count_followers_for_creator(input: ZomeFnInput<AgentPubKey>) -> ExternResult<usize> {
    count_links(LinkQuery::new(
        input.input,
        LinkTypes::CreatorToFollowers.try_into_filter()?,
    ))
}

#[hdk_extern]
pub fn get_follower_links_for_creator(
    input: ZomeFnInput<GetFollowersForCreatorInput>,
) -> ExternResult<Vec<Link>> {
    let strategy = input.get_strategy();
    let mut links = get_links(
        LinkQuery::new(
            AnyLinkableHash::from(input.input.creator),
            LinkTypes::CreatorToFollowers.try_into_filter()?,
        ),
        strategy,
    )?;

    links.dedup_by_key(|l| l.target.clone());
    let links_page = paginate_by_agentpubkey(links, input.input.page)?;

    Ok(links_page)
}

#[hdk_extern]
pub fn get_follower_link_details_for_creator(
    input: ZomeFnInput<AgentPubKey>,
) -> ExternResult<LinkDetails> {
    let strategy = input.get_strategy();
    let links = get_links_details(
        LinkQuery::new(
            AnyLinkableHash::from(input.input),
            LinkTypes::CreatorToFollowers.try_into_filter()?,
        ),
        strategy,
    )?;

    Ok(links)
}

#[hdk_extern]
pub fn remove_creator_for_follower(input: RemoveCreatorForFollowerInput) -> ExternResult<()> {
    let links = get_links(
        LinkQuery::new(
            AnyLinkableHash::from(input.base_follower.clone()),
            LinkTypes::FollowerToCreators.try_into_filter()?,
        ),
        GetStrategy::Local,
    )?;

    for link in links {
        let entry_hash =
            EntryHash::try_from(link.target.clone()).map_err(|err| wasm_error!(err))?;
        if AgentPubKey::from(entry_hash).eq(&input.target_creator) {
            delete_link(link.create_link_hash, GetOptions::local())?;
        }
    }

    let links = get_links(
        LinkQuery::new(
            AnyLinkableHash::from(input.target_creator.clone()),
            LinkTypes::CreatorToFollowers.try_into_filter()?,
        ),
        GetStrategy::Local,
    )?;

    for link in links {
        let entry_hash =
            EntryHash::try_from(link.target.clone()).map_err(|err| wasm_error!(err))?;
        if AgentPubKey::from(entry_hash).eq(&input.base_follower) {
            delete_link(link.create_link_hash, GetOptions::local())?;
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
