use follows_integrity::LinkTypes;
// use follows_integrity::*;
use follows_types::*;
use hc_call_utils::call_local_zome;
use hc_link_pagination::paginate_by_agentpubkey;
// use hc_link_pagination::paginate_by_agentpubkey;
use hdk::prelude::*;

use mews_types::FOLLOW_TOPIC;
use trust_atom_types::{DeleteReport, QueryInput, TrustAtom, TrustAtomInput};

#[derive(Debug, Serialize, Deserialize, SerializedBytes)]
pub struct FollowInput {
    pub agent: AgentPubKey,
    pub follow_topics: Vec<FollowTopicInput>,
}

#[derive(Debug, Serialize, Deserialize, SerializedBytes)]
pub struct FollowTopicInput {
    pub topic: String,
    pub weight: String,
}

#[derive(Debug, Serialize, Deserialize, SerializedBytes)]
pub struct TrustedFeedInput {
    pub agent: AgentPubKey,
    pub topic: String,
    pub weight: String,
}
#[hdk_extern]
pub fn add_creator_for_follower(input: AddCreatorForFollowerInput) -> ExternResult<()> {
    call_local_zome(
        "trust_atom",
        "create_trust_atom",
        TrustAtomInput {
            target: AnyLinkableHash::from(input.target_creator),
            content: Some(String::from(FOLLOW_TOPIC)),
            value: None,
            extra: None,
        },
    )
}

#[hdk_extern]
pub fn get_creators_for_follower(
    input: GetCreatorsForFollowerInput,
) -> ExternResult<Vec<AgentPubKey>> {
    let links_from_follower_to_creators: Vec<TrustAtom> = call_local_zome(
        "trust_atom",
        "query",
        QueryInput {
            source: Some(AnyLinkableHash::from(input.follower)),
            target: None,
            content_full: Some(String::from(FOLLOW_TOPIC)),
            content_starts_with: None,
            content_not_starts_with: None,
            value_starts_with: None,
        },
    )?;

    let creators: Vec<AgentPubKey> = links_from_follower_to_creators
        .into_iter()
        .filter_map(|link| link.target_hash.into_entry_hash())
        .map(AgentPubKey::from)
        .collect();

    Ok(creators)
}

#[hdk_extern]
pub fn get_followers_for_creator(creator: AgentPubKey) -> ExternResult<Vec<AgentPubKey>> {
    let links_from_followers_to_creator: Vec<TrustAtom> = call_local_zome(
        "trust_atom",
        "query",
        QueryInput {
            source: None,
            target: Some(AnyLinkableHash::from(creator)),
            content_full: Some(String::from(FOLLOW_TOPIC)),
            content_starts_with: None,
            content_not_starts_with: None,
            value_starts_with: None,
        },
    )?;

    let followers: Vec<AgentPubKey> = links_from_followers_to_creator
        .into_iter()
        .filter_map(|link| link.source_hash.into_entry_hash())
        .map(AgentPubKey::from)
        .collect();

    Ok(followers)
}

#[hdk_extern]
pub fn count_creators_for_follower(follower: AgentPubKey) -> ExternResult<usize> {
    count_links(LinkQuery::new(
        follower,
        LinkTypes::FollowerToCreators.try_into_filter()?,
    ))
}

#[hdk_extern]
pub fn count_followers_for_creator(creator: AgentPubKey) -> ExternResult<usize> {
    count_links(LinkQuery::new(
        creator,
        LinkTypes::CreatorToFollowers.try_into_filter()?,
    ))
}

#[hdk_extern]
pub fn get_follower_links_for_creator(
    input: GetFollowersForCreatorInput,
) -> ExternResult<Vec<Link>> {
    let mut links = get_links(
        GetLinksInputBuilder::try_new(
            input.creator,
            LinkTypes::CreatorToFollowers.try_into_filter()?,
        )?
        .build(),
    )?;

    links.dedup_by_key(|l| l.target.clone());
    let links_page = paginate_by_agentpubkey(links, input.page)?;

    Ok(links_page)
}

#[hdk_extern]
pub fn get_follower_link_details_for_creator(creator: AgentPubKey) -> ExternResult<LinkDetails> {
    let links = get_link_details(
        creator,
        LinkTypes::CreatorToFollowers,
        None,
        GetOptions::default(),
    )?;

    Ok(links)
}

#[hdk_extern]
pub fn remove_creator_for_follower(input: RemoveCreatorForFollowerInput) -> ExternResult<()> {
    let _deleted_link_count: DeleteReport = call_local_zome(
        "trust_atom",
        "delete_trust_atoms",
        AnyLinkableHash::from(input.target_creator),
    )?;

    Ok(())
}

#[hdk_extern]
pub fn follow(input: FollowInput) -> ExternResult<()> {
    let agent_pubkey = agent_info()?.agent_initial_pubkey;
    if input.agent == agent_pubkey {
        return Err(wasm_error!("You cannot follow yourself"));
    }

    add_creator_for_follower(AddCreatorForFollowerInput {
        base_follower: agent_pubkey,
        target_creator: input.agent.clone(),
    })?;

    for follow_topic in input.follow_topics {
        let _: TrustAtom = call_local_zome(
            "trust_atom",
            "create_trust_atom",
            TrustAtomInput {
                target: AnyLinkableHash::from(input.agent.clone()),
                content: Some(follow_topic.topic),
                value: Some(follow_topic.weight),
                extra: None,
            },
        )?;
    }
    Ok(())
}

#[hdk_extern]
pub fn unfollow(agent: AgentPubKey) -> ExternResult<()> {
    remove_creator_for_follower(RemoveCreatorForFollowerInput {
        base_follower: agent_info()?.agent_initial_pubkey,
        target_creator: agent,
    })
}
