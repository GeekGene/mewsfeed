use hdk::prelude::*;
use hc_call_utils::call_local_zome;

#[hdk_extern]
pub fn get_lickers_for_mew(mew_hash: ActionHash) -> ExternResult<Vec<AgentPubKey>> {
    call_local_zome::<Vec<AgentPubKey>, ActionHash>("likes", "get_likers_for_hash", mew_hash)
}

#[hdk_extern]
pub fn get_liker_links_for_mew(mew_hash: ActionHash) -> ExternResult<Vec<Link>> {
    call_local_zome::<Vec<Link>, ActionHash>("likes", "get_liker_links_for_hash", mew_hash)
}
