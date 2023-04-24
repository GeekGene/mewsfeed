pub mod mew_to_responses;
pub mod liker_to_mews;
pub mod hashtag_to_mews;
pub mod cashtag_to_mews;
pub mod mention_to_mews;
pub mod agent_mews;
pub mod all_mews;
pub mod mew;
pub mod prefix_index;
use hdk::prelude::*;
use mews_integrity::*;
#[hdk_extern]
pub fn init(_: ()) -> ExternResult<InitCallbackResult> {
    Ok(InitCallbackResult::Pass)
}
