use crate::mew_with_context::get_batch_mews_with_context_internal;
use hc_call_utils::call_local_zome;
use hc_zome_input::ZomeFnInput;
use hdk::prelude::*;
use mews_types::FeedMew;

pub fn get_is_hash_pinned(hash: ActionHash) -> ExternResult<bool> {
    call_local_zome::<bool, ActionHash>("agent_pins", "is_hash_pinned", hash)
}

#[hdk_extern]
pub fn get_mews_for_pinner_with_context(input: ZomeFnInput<AgentPubKey>) -> ExternResult<Vec<FeedMew>> {
    let get_options = input.get_options();
    let local = Some(input.get_strategy() == GetStrategy::Local);
    let pinned_hashes = call_local_zome::<Vec<AnyLinkableHash>, ZomeFnInput<AgentPubKey>>(
        "agent_pins",
        "get_hashes_for_pinner",
        ZomeFnInput::new(input.input, local),
    )?;
    let pinned_action_hashes: Vec<ActionHash> = pinned_hashes
        .iter()
        .filter_map(|h| ActionHash::try_from(h.clone()).ok())
        .collect();

    get_batch_mews_with_context_internal(pinned_action_hashes, get_options)
}
