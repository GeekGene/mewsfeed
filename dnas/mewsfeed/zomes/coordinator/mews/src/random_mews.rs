use crate::all_mews::get_all_mew_hashes;
use crate::tag_to_mews::get_mew_hashes_for_tag;
use hdk::prelude::*;
use mews_integrity::make_tag_prefix_index;
use rand::seq::SliceRandom;

#[hdk_extern]
pub fn get_random_mew_hashes(count: usize) -> ExternResult<Vec<ActionHash>> {
    let hashes = get_all_mew_hashes()?;

    let selected_hashes: Vec<ActionHash> = hashes
        .choose_multiple(&mut rand::thread_rng(), count)
        .cloned()
        .collect();

    Ok(selected_hashes)
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
pub fn get_random_mew_hashes_for_tag(
    input: GetRandomMewsForTagInput,
) -> ExternResult<Vec<ActionHash>> {
    let hashes = get_mew_hashes_for_tag(input.tag, .., None)?;

    let selected_hashes: Vec<ActionHash> = hashes
        .choose_multiple(&mut rand::thread_rng(), input.count)
        .cloned()
        .collect();

    Ok(selected_hashes)
}
