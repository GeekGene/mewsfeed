use crate::mew_with_context::get_batch_mews_with_context_internal;
use hc_link_pagination::{paginate_by_hash, HashPagination};
use hc_zome_input::ZomeFnInput;
use hdk::prelude::*;
use mews_integrity::*;

#[derive(Serialize, Deserialize, SerializedBytes, Clone, Debug)]
pub struct GetAgentMewsInput {
    pub agent: AgentPubKey,
    pub page: Option<HashPagination>,
}

#[hdk_extern]
pub fn get_agent_mews(input: ZomeFnInput<GetAgentMewsInput>) -> ExternResult<Vec<Record>> {
    let get_options = input.get_options();
    let strategy = input.get_strategy();
    let hashes = get_agent_mew_hashes_internal(input.input, strategy)?;
    let get_input: Vec<GetInput> = hashes
        .into_iter()
        .map(|hash| GetInput::new(hash.into(), get_options.clone()))
        .collect();
    let records = HDK.with(|hdk| hdk.borrow().get(get_input))?;
    let records: Vec<Record> = records.into_iter().flatten().collect();
    Ok(records)
}

#[hdk_extern]
pub fn get_agent_mews_with_context(
    input: ZomeFnInput<GetAgentMewsInput>,
) -> ExternResult<Vec<FeedMew>> {
    let get_options = input.get_options();
    let strategy = input.get_strategy();
    let hashes = get_agent_mew_hashes_internal(input.input, strategy)?;

    get_batch_mews_with_context_internal(hashes, get_options)
}

fn get_agent_mew_hashes_internal(
    input: GetAgentMewsInput,
    strategy: GetStrategy,
) -> ExternResult<Vec<ActionHash>> {
    let links = get_links(
        LinkQuery::new(
            AnyLinkableHash::from(input.agent),
            LinkTypes::AgentMews.try_into_filter()?,
        ),
        strategy,
    )?;

    let links_slice = paginate_by_hash(links, input.page)?;

    let hashes: Vec<ActionHash> = links_slice
        .into_iter()
        .filter_map(|link| ActionHash::try_from(link.target).ok())
        .collect();

    Ok(hashes)
}
