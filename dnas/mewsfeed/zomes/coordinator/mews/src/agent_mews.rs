use crate::mew_with_context::get_batch_mews_with_context;
use hc_link_pagination::{paginate_by_hash, HashPagination};
use hdk::prelude::*;
use mews_integrity::*;

#[derive(Serialize, Deserialize, SerializedBytes, Clone, Debug)]
pub struct GetAgentMewsInput {
    pub agent: AgentPubKey,
    pub page: Option<HashPagination>,
}
#[hdk_extern]
pub fn get_agent_mews(input: GetAgentMewsInput) -> ExternResult<Vec<Record>> {
    let hashes = get_agent_mew_hashes(input)?;
    let get_input: Vec<GetInput> = hashes
        .into_iter()
        .map(|hash| GetInput::new(hash.into(), GetOptions::default()))
        .collect();
    let records = HDK.with(|hdk| hdk.borrow().get(get_input))?;
    let records: Vec<Record> = records.into_iter().flatten().collect();
    Ok(records)
}

#[hdk_extern]
pub fn get_agent_mews_with_context(input: GetAgentMewsInput) -> ExternResult<Vec<FeedMew>> {
    let hashes = get_agent_mew_hashes(input)?;

    get_batch_mews_with_context(hashes)
}

fn get_agent_mew_hashes(input: GetAgentMewsInput) -> ExternResult<Vec<ActionHash>> {
    let links = get_links(
        GetLinksInputBuilder::try_new(input.agent, LinkTypes::AgentMews.try_into_filter()?)?
            .build(),
    )?;

    let links_slice = paginate_by_hash(links, input.page)?;

    let hashes: Vec<ActionHash> = links_slice
        .into_iter()
        .filter_map(|link| ActionHash::try_from(link.target).ok())
        .collect();

    Ok(hashes)
}
