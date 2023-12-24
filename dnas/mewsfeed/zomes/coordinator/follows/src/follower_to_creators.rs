// use follows_integrity::*;
use follows_types::*;
use hc_call_utils::call_local_zome;
// use hc_link_pagination::paginate_by_agentpubkey;
use hdk::prelude::*;

use mews_types::FOLLOW_TOPIC;
use trust_atom_types::{DeleteReport, QueryInput, TrustAtom, TrustAtomInput};

#[derive(Debug, Serialize, Deserialize, SerializedBytes)]
#[serde(rename_all = "camelCase")]
pub struct FollowInput {
    pub agent: AgentPubKey,
    pub follow_topics: Vec<FollowTopicInput>,
}

#[derive(Debug, Serialize, Deserialize, SerializedBytes)]
#[serde(rename_all = "camelCase")]
pub struct FollowTopicInput {
    pub topic: String,
    pub weight: String,
}

#[derive(Debug, Serialize, Deserialize, SerializedBytes)]
#[serde(rename_all = "camelCase")]
pub struct TrustedFeedInput {
    pub agent: AgentPubKey,
    pub topic: String,
    pub weight: String,
}

#[hdk_extern]
pub fn add_creator_for_follower(input: AddCreatorForFollowerInput) -> ExternResult<()> {
    let _: TrustAtom = call_local_zome(
        "trust_atom",
        "create_trust_atom",
        TrustAtomInput {
            target: AnyLinkableHash::from(input.target_creator),
            content: Some(String::from(FOLLOW_TOPIC)),
            value: None,
            extra: None,
        },
    )?;

    Ok(())
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
    let query = LinkQuery::new(
        follower,
        LinkTypeFilter::single_type(
            ZomeIndex(2),
            LinkType(0), // LinkTypes::FollowerToCreators
        ),
    );
    count_links(query)
}

#[hdk_extern]
pub fn count_followers_for_creator(creator: AgentPubKey) -> ExternResult<usize> {
    let query = LinkQuery::new(
        creator,
        LinkTypeFilter::single_type(
            ZomeIndex(2),
            LinkType(1), // LinkTypes::CreatorToFollowers
        ),
    );
    count_links(query)
}

#[hdk_extern]
pub fn remove_creator_for_follower(input: RemoveCreatorForFollowerInput) -> ExternResult<()> {
    let _deleted_link_count: DeleteReport = call_local_zome(
        "trust_atom",
        "delete_trust_atoms",
        AnyLinkableHash::from(input.target_creator),
    )?;

    // let links = get_links(
    //     input.base_follower.clone(),
    //     LinkTypes::FollowerToCreators,
    //     None,
    // )?;

    // for link in links {
    //     if AgentPubKey::from(EntryHash::from(link.target.clone())).eq(&input.target_creator) {
    //         delete_link(link.create_link_hash)?;
    //     }
    // }

    // let links = get_links(
    //     input.target_creator.clone(),
    //     // TODO trust atoms instead
    //     // LinkTypes::TrustAtom,
    //     None,
    // )?;

    // for link in links {
    //     if AgentPubKey::from(EntryHash::from(link.target.clone())).eq(&input.base_follower) {
    //         delete_link(link.create_link_hash)?;
    //     }
    // }

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
