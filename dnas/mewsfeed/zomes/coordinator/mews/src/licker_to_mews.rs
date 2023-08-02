use hc_call_utils::call_local_zome;
use hdk::prelude::*;

#[hdk_extern]
pub fn get_lickers_for_mew(mew_hash: ActionHash) -> ExternResult<Vec<AgentPubKey>> {
    call_local_zome::<Vec<AgentPubKey>, ActionHash>("likes", "get_likers_for_hash", mew_hash)
}

#[hdk_extern]
pub fn count_lickers_for_mew(mew_hash: ActionHash) -> ExternResult<usize> {
    call_local_zome::<usize, ActionHash>("likes", "count_likers_for_hash", mew_hash)
}

#[derive(Serialize, Deserialize, Debug)]
pub struct IsLikerForHashInput {
    pub liker: AgentPubKey,
    pub hash: AnyLinkableHash,
}
#[hdk_extern]
pub fn is_licker_for_mew(input: IsLikerForHashInput) -> ExternResult<bool> {
    call_local_zome::<bool, IsLikerForHashInput>("likes", "is_liker_for_hash", input)
}
