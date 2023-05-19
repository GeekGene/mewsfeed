use crate::mew_with_context::get_batch_mews_with_context;
use hdk::prelude::*;
use mews_types::FeedMew;
use hc_call_utils::call_local_zome;

pub fn get_is_hash_pinned(hash: ActionHash) -> ExternResult<bool> {
    call_local_zome::<bool, ActionHash>("agent_pins", "is_hash_pinned", hash)
}

#[hdk_extern]
pub fn get_mews_for_pinner_with_context(agent: AgentPubKey) -> ExternResult<Vec<FeedMew>> {
    let pinned_hashes = call_local_zome::<Vec<AnyLinkableHash>, AgentPubKey>("agent_pins", "get_hashes_for_pinner", agent)?;
    let pinned_action_hashes: Vec<ActionHash> = pinned_hashes
        .iter()
        .map(|h| ActionHash::from(h.clone()))
        .collect();

    get_batch_mews_with_context(pinned_action_hashes)
}
