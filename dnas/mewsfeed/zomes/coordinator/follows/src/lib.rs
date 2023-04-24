pub mod follower_to_followees;

use hdk::prelude::*;
use follows_integrity::*;
#[hdk_extern]
pub fn init(_: ()) -> ExternResult<InitCallbackResult> {
    Ok(InitCallbackResult::Pass)
}
