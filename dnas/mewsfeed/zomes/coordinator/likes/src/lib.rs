pub mod liker_to_hashes;
use hdk::prelude::*;
use likes_integrity::*;

#[hdk_extern]
pub fn init(_: ()) -> ExternResult<InitCallbackResult> {
    Ok(InitCallbackResult::Pass)
}
