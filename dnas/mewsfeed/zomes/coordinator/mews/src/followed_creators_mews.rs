use crate::mew_with_context::get_batch_mews_with_context;
use hc_call_utils::call_local_zome;
use hc_link_pagination::{get_by_agentpubkey_pagination, AgentPubKeyPagination};
use hdk::prelude::*;
use mews_integrity::*;
use follows_types::GetCreatorsForFollowerInput;

#[derive(Serialize, Deserialize, SerializedBytes, Clone, Debug)]
pub struct GetFollowedCreatorsMewsInput {
    pub agent: AgentPubKey,
    pub page: Option<AgentPubKeyPagination>,
}
#[hdk_extern]
pub fn get_followed_creators_mews(
    input: GetFollowedCreatorsMewsInput,
) -> ExternResult<Vec<Record>> {
    let hashes = get_followed_creators_mew_hashes(input)?;
    let get_input: Vec<GetInput> = hashes
        .into_iter()
        .map(|hash| GetInput::new(hash.into(), GetOptions::default()))
        .collect();
    let records = HDK.with(|hdk| hdk.borrow().get(get_input))?;
    let records: Vec<Record> = records.into_iter().flatten().collect();

    Ok(records)
}

#[hdk_extern]
pub fn get_followed_creators_mews_with_context(
    input: GetFollowedCreatorsMewsInput,
) -> ExternResult<Vec<FeedMew>> {
    let hashes = get_followed_creators_mew_hashes(input)?;

    get_batch_mews_with_context(hashes)
}

fn get_followed_creators_mew_hashes(
    input: GetFollowedCreatorsMewsInput,
) -> ExternResult<Vec<ActionHash>> {
    let mut creators: Vec<AgentPubKey> = call_local_zome::<Vec<AgentPubKey>, GetCreatorsForFollowerInput>(
        "follows",
        "get_creators_for_follower",
        GetCreatorsForFollowerInput {
            follower: input.agent.clone(),
            page: input.page.clone()
        },
    )?;
    creators.push(input.agent);

    let links: Vec<Link> = creators
        .into_iter()
        .filter_map(|agent| {
            get_links(AnyLinkableHash::from(agent), LinkTypes::AgentMews, None).ok()
        })
        .flatten()
        .collect();
    let links_page = get_by_agentpubkey_pagination(links, input.page)?;

    let hashes: Vec<ActionHash> = links_page
        .into_iter()
        .map(|link| ActionHash::from(link.target))
        .collect();

    Ok(hashes)
}

#[hdk_extern]
pub fn get_my_followed_creators_mews_with_context(
    page: Option<AgentPubKeyPagination>,
) -> ExternResult<Vec<FeedMew>> {
    get_followed_creators_mews_with_context(GetFollowedCreatorsMewsInput {
        agent: agent_info()?.agent_initial_pubkey,
        page,
    })
}
