use hc_call_utils::call_local_zome;
use hdk::prelude::*;

#[hdk_extern]
pub fn get_lickers_for_mew(mew_hash: ActionHash) -> ExternResult<Vec<AgentPubKey>> {
    call_local_zome::<Vec<AgentPubKey>, ActionHash>("likes", "get_likers_for_hash", mew_hash)
}
