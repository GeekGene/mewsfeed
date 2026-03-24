use crate::liker_to_hashes::{count_likers_for_hash, is_liker_for_hash, IsLikerForHashInput};
use hc_zome_input::ZomeFnInput;
use hdk::prelude::*;

#[hdk_extern]
pub fn get_lickers_for_mew(mew_hash: ActionHash) -> ExternResult<Vec<AgentPubKey>> {
    crate::liker_to_hashes::get_likers_for_hash(ZomeFnInput::new(
        AnyLinkableHash::from(mew_hash),
        Some(true),
    ))
}

#[hdk_extern]
pub fn count_lickers_for_mew(mew_hash: ActionHash) -> ExternResult<usize> {
    count_likers_for_hash(AnyLinkableHash::from(mew_hash))
}

#[hdk_extern]
pub fn is_licker_for_mew(input: IsLikerForHashInput) -> ExternResult<bool> {
    is_liker_for_hash(input)
}
