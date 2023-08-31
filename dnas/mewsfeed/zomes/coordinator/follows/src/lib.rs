use hdk::prelude::*;
pub mod follower_to_creators;
use follows_integrity::LinkTypes;

#[hdk_extern]
pub fn init(_: ()) -> ExternResult<InitCallbackResult> {
    Ok(InitCallbackResult::Pass)
}
