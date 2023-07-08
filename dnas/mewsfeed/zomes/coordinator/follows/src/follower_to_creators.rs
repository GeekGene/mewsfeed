use follows_types::*;
use hc_call_utils::call_local_zome;
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
pub struct AddCreatorForFollowerInput {
    pub base_follower: AgentPubKey,
    pub target_creator: AgentPubKey,
}

#[derive(Debug, Serialize, Deserialize, SerializedBytes)]
#[serde(rename_all = "camelCase")]
pub struct FollowTopicInput {
    pub topic: String,
    pub weight: Option<String>, // TOOD should this be a number?  Safer transmission as a string, but more idiomatic as a number
}

#[hdk_extern] // TODO only called by tests; shold this be private?
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
        .map(|link| AgentPubKey::from(EntryHash::from(link.target_hash)))
        .collect();

    Ok(creators)

    // TODO integrate pagination, something like:

    // let links = get_links(input.follower, LinkTypes::FollowerToCreators, None)?;
    // let links_page = paginate_by_agentpubkey(links, input.page)?;

    // let agents: Vec<AgentPubKey> = links_page
    //     .into_iter()
    //     .map(|link| AgentPubKey::from(EntryHash::from(link.target)))
    //     .collect();

    // Ok(agents)
}

#[hdk_extern]
pub fn get_followers_for_creator(creator: AgentPubKey) -> ExternResult<Vec<AgentPubKey>> {
    // WAS: let links = get_follower_links_for_creator(creator)?;
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
        .map(|link| AgentPubKey::from(EntryHash::from(link.source_hash)))
        .collect();

    Ok(followers)
}

// TODO do we need something like this?
// #[hdk_extern]
// pub fn get_follower_links_for_creator(creator: AgentPubKey) -> ExternResult<Vec<Link>> {
//     let mut links = get_links(creator, trust_atom_types: LinkTypes::TrustAtom, None)?;
//     links.dedup_by_key(|l| l.target.clone());

//     Ok(links)
// }

// TODO do we need something like this?
// #[hdk_extern]
// pub fn get_follower_link_details_for_creator(creator: AgentPubKey) -> ExternResult<LinkDetails> {
//     let links = get_link_details(creator, LinkTypes::TrustAtom, None)?;

//     Ok(links)
// }

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
                value: follow_topic.weight,
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
