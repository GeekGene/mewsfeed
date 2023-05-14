use crate::mew_with_context::get_batch_mews_with_context;
use hdk::prelude::*;
use mews_integrity::*;

#[hdk_extern]
pub fn get_agent_mews(author: AgentPubKey) -> ExternResult<Vec<Record>> {
    let hashes = get_agent_mew_hashes(author)?;
    let get_input: Vec<GetInput> = hashes
        .into_iter()
        .map(|hash| GetInput::new(hash.into(), GetOptions::default()))
        .collect();
    let records = HDK.with(|hdk| hdk.borrow().get(get_input))?;
    let records: Vec<Record> = records.into_iter().flatten().collect();
    Ok(records)
}

#[hdk_extern]
pub fn get_agent_mews_with_context(author: AgentPubKey) -> ExternResult<Vec<FeedMew>> {
    let hashes = get_agent_mew_hashes(author)?;

    get_batch_mews_with_context(hashes)
}

fn get_agent_mew_hashes(author: AgentPubKey) -> ExternResult<Vec<ActionHash>> {
    let mut links = get_links(author, LinkTypes::AgentMews, None)?;
    links.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
    let hashes: Vec<ActionHash> = links
        .into_iter()
        .map(|link| ActionHash::from(link.target))
        .collect();

    Ok(hashes)
}
