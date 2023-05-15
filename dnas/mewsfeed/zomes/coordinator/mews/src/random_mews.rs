use hdk::prelude::*;
use crate::mew_with_context::get_batch_mews_with_context;
use crate::all_mews::get_all_mew_hashes;
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
