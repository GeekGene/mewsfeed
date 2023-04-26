use hdk::prelude::*;
pub mod prefix_index_to_hashes;
pub use prefix_index_to_hashes::*;

/// Called the first time a zome call is made to the cell containing this zome
#[hdk_extern]
pub fn init(_: ()) -> ExternResult<InitCallbackResult> {
  Ok(InitCallbackResult::Pass)
}
