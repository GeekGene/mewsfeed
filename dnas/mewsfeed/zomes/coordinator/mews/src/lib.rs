use hdk::prelude::*;
pub mod agent_mews;
pub mod agent_to_notifications;
pub mod all_mews;
pub mod cashtag_to_mews;
pub mod followed_creators_mews;
pub mod hashtag_to_mews;
pub mod licker_to_mews;
pub mod mention_to_mews;
pub mod mew;
pub mod mew_to_responses;
pub mod mew_with_context;
pub mod pinner_to_mews;
pub mod random_mews;
pub mod search_tags;
pub mod tag_to_mews;

use mews_integrity::LinkTypes;
#[hdk_extern]
pub fn init(_: ()) -> ExternResult<InitCallbackResult> {
    Ok(InitCallbackResult::Pass)
}
