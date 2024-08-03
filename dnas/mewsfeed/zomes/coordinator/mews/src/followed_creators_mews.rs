use crate::mew_with_context::get_batch_mews_with_context;
use follows_types::GetCreatorsForFollowerInput;
use hc_call_utils::call_local_zome;
use hc_link_pagination::{paginate_by_hash, HashPagination};
use hdk::prelude::*;
use mews_integrity::*;

#[derive(Serialize, Deserialize, SerializedBytes, Clone, Debug)]
pub struct GetFollowedCreatorsMewsInput {
    pub agent: AgentPubKey,
    pub page: Option<HashPagination>,
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
    let mut creators: Vec<AgentPubKey> =
        call_local_zome::<Vec<AgentPubKey>, GetCreatorsForFollowerInput>(
            "follows",
            "get_creators_for_follower",
            GetCreatorsForFollowerInput {
                follower: input.agent.clone(),
                page: None,
            },
        )?;
    creators.push(input.agent);

    let links: Vec<Link> = creators
        .into_iter()
        .filter_map(|agent| {
            get_links(GetLinksInput {
                base_address: agent.into(),
                link_type: LinkTypes::AgentMews.try_into_filter().ok().unwrap(),
                get_options: GetOptions::default(),
                tag_prefix: None,
                after: None,
                before: None,
                author: None,
            })
            .ok()
        })
        .flatten()
        .collect();
    let links_page = paginate_by_hash(links, input.page)?;

    let hashes: Vec<ActionHash> = links_page
        .into_iter()
        .filter_map(|link| ActionHash::try_from(link.target).ok())
        .collect();

    Ok(hashes)
}

#[hdk_extern]
pub fn get_my_followed_creators_mews_with_context(
    page: Option<HashPagination>,
) -> ExternResult<Vec<FeedMew>> {
    get_followed_creators_mews_with_context(GetFollowedCreatorsMewsInput {
        agent: agent_info()?.agent_initial_pubkey,
        page,
    })
}
