use crate::all_mews::get_all_mew_hashes;
use crate::tag_to_mews::get_mew_hashes_for_tag;
use crate::mew_with_context::get_batch_mews_with_context;
use hdk::prelude::*;
use mews_integrity::make_tag_prefix_index;
use mews_types::FeedMew;
use rand::seq::SliceRandom;

#[hdk_extern]
pub fn get_random_mews_with_context(count: usize) -> ExternResult<Vec<FeedMew>> {
    let hashes = get_all_mew_hashes()?;

    let selected_hashes: Vec<ActionHash> = hashes
        .choose_multiple(&mut rand::thread_rng(), count)
        .cloned()
        .collect();

    let mut feedmews = get_batch_mews_with_context(selected_hashes)?;
    feedmews.sort_by_key(|f| f.action.timestamp());

    Ok(feedmews)
}

#[hdk_extern]
pub fn get_random_tags(count: usize) -> ExternResult<Vec<String>> {
    let prefix_index = make_tag_prefix_index()?;

    prefix_index.get_random_results(count)
}

#[derive(Serialize, Deserialize, Debug)]
pub struct GetRandomMewsForTagInput {
    tag: String,
    count: usize,
}
#[hdk_extern]
pub fn get_random_mews_for_tag_with_context(input: GetRandomMewsForTagInput) -> ExternResult<Vec<FeedMew>> {    
    let hashes = get_mew_hashes_for_tag(input.tag, ..)?;
    
    let selected_hashes: Vec<ActionHash> = hashes
        .choose_multiple(&mut rand::thread_rng(), input.count)
        .map(|h| h.clone())
        .collect();

    let mut feedmews = get_batch_mews_with_context(selected_hashes)?;
    feedmews.sort_by_key(|f| f.action.timestamp());

    Ok(feedmews)
}
