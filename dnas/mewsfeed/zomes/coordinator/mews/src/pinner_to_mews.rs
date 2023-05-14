use crate::mew_with_context::get_batch_mews_with_context;
use hdk::prelude::*;
use mews_types::FeedMew;

pub fn get_is_hash_pinned(hash: ActionHash) -> ExternResult<bool> {
    let zome_call_response = call(
        CallTargetCell::Local,
        "agent_pins",
        FunctionName::from("is_hash_pinned"),
        None,
        hash,
    )?;

    match zome_call_response {
        ZomeCallResponse::Ok(response) => {
            let is_pinned: bool = response.decode().map_err(|_| {
                wasm_error!(WasmErrorInner::Guest(
                    "Failed to deserialize zome call response".into()
                ))
            })?;

            Ok(is_pinned)
        }
        _ => Err(wasm_error!(WasmErrorInner::Guest(
            "Failed to call 'is_hash_pinned' in zome 'agent_pins'".into()
        ))),
    }
}

#[hdk_extern]
pub fn get_mews_for_pinner_with_context(agent: AgentPubKey) -> ExternResult<Vec<FeedMew>> {
    let zome_call_response = call(
        CallTargetCell::Local,
        "agent_pins",
        FunctionName::from("get_hashes_for_pinner"),
        None,
        agent,
    )?;

    match zome_call_response {
        ZomeCallResponse::Ok(response) => {
            let pinned_hashes: Vec<AnyLinkableHash> = response.decode().map_err(|_| {
                wasm_error!(WasmErrorInner::Guest(
                    "Failed to deserialize zome call response".into()
                ))
            })?;

            let pinned_action_hashes: Vec<ActionHash> = pinned_hashes
                .iter()
                .map(|h| ActionHash::from(h.clone()))
                .collect();

            get_batch_mews_with_context(pinned_action_hashes)
        }
        _ => Err(wasm_error!(WasmErrorInner::Guest(
            "Failed to call 'is_hash_pinned' in zome 'agent_pins'".into()
        ))),
    }
}
