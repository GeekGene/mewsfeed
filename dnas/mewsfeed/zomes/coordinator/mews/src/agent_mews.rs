use hdk::prelude::*;
use mews_integrity::*;
use crate::mew::get_mew_with_context;

#[hdk_extern]
pub fn get_agent_mews(author: AgentPubKey) -> ExternResult<Vec<Record>> {
    let hashes = get_agent_mew_hashes(author)?;
    let get_input: Vec<GetInput> = hashes
        .into_iter()
        .map(|hash| GetInput::new(
            hash.into(),
            GetOptions::default(),
        ))
        .collect();
    let records = HDK.with(|hdk| hdk.borrow().get(get_input))?;
    let records: Vec<Record> = records.into_iter().filter_map(|r| r).collect();
    Ok(records)
}

#[hdk_extern]
pub fn get_agent_mews_with_context(author: AgentPubKey) -> ExternResult<Vec<FeedMew>> {
    let hashes = get_agent_mew_hashes(author)?;

    let feedmews: Vec<FeedMew> = hashes
        .into_iter()
        .filter_map(|hash| get_mew_with_context(hash).ok())
        .collect();

    Ok(feedmews)
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