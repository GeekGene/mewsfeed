use crate::licker_to_mews::*;
use crate::mew_to_responses::*;
use crate::pinner_to_mews::get_is_hash_pinned;
use hdk::prelude::*;
use mews_integrity::*;

#[hdk_extern]
pub fn get_mew_with_context(original_mew_hash: ActionHash) -> ExternResult<FeedMew> {
    let response = get_details(original_mew_hash.clone(), GetOptions::default())?.ok_or(
        wasm_error!(WasmErrorInner::Guest(String::from("Mew not found"))),
    )?;

    match response {
        Details::Record(RecordDetails {
            record, deletes, ..
        }) => {
            let mew: Mew = record
                .entry()
                .to_app_option()
                .map_err(|e| wasm_error!(WasmErrorInner::Guest(e.into())))?
                .ok_or(wasm_error!(WasmErrorInner::Guest(String::from(
                    "Malformed mew"
                ))))?;

            let replies = get_response_hashes_for_mew(GetResponsesForMewInput {
                original_mew_hash: original_mew_hash.clone(),
                response_type: Some(ResponseType::Reply),
            })?;
            let quotes = get_response_hashes_for_mew(GetResponsesForMewInput {
                original_mew_hash: original_mew_hash.clone(),
                response_type: Some(ResponseType::Quote),
            })?;
            let mewmews = get_response_hashes_for_mew(GetResponsesForMewInput {
                original_mew_hash: original_mew_hash.clone(),
                response_type: Some(ResponseType::Mewmew),
            })?;
            let licks = get_lickers_for_mew(original_mew_hash)?;
            let deleted_timestamp = deletes
                .first()
                .map(|first_delete| first_delete.action().timestamp());
            let author_profile = get_agent_profile(record.action().author().clone())?;
            let is_pinned = get_is_hash_pinned(record.action_hashed().hash.clone())?;

            match mew.clone().mew_type {
                MewType::Original => Ok(FeedMew {
                    mew,
                    action: record.action().clone(),
                    action_hash: record.signed_action().as_hash().clone(),
                    replies,
                    quotes,
                    licks,
                    mewmews,
                    deleted_timestamp,
                    author_profile,
                    is_pinned,
                    original_mew: None,
                    original_mew_author: None,
                    original_mew_author_profile: None,
                    original_mew_deleted_timestamp: None,
                }),
                MewType::Reply(response_to_hash)
                | MewType::Quote(response_to_hash)
                | MewType::Mewmew(response_to_hash) => {
                    let details = get_details(response_to_hash, GetOptions::default())?.ok_or(
                        wasm_error!(WasmErrorInner::Guest(String::from("Mew not found"))),
                    )?;

                    match details {
                        Details::Record(record_details) => {
                            let original_mew_author =
                                record_details.record.action().author().clone();
                            let original_mew_author_profile =
                                get_agent_profile(original_mew_author.clone())?;
                            let original_mew_deleted_timestamp = deletes
                                .first()
                                .map(|first_delete| first_delete.action().timestamp());

                            let original_mew: Mew = record_details
                                .record
                                .entry()
                                .to_app_option()
                                .map_err(|e| wasm_error!(WasmErrorInner::Guest(e.into())))?
                                .ok_or(wasm_error!(WasmErrorInner::Guest(String::from(
                                    "Malformed original mew"
                                ))))?;

                            Ok(FeedMew {
                                mew,
                                action: record.action().clone(),
                                action_hash: record.signed_action().as_hash().clone(),
                                replies,
                                quotes,
                                licks,
                                mewmews,
                                author_profile,
                                deleted_timestamp,
                                is_pinned,
                                original_mew: Some(original_mew),
                                original_mew_author: Some(original_mew_author),
                                original_mew_author_profile,
                                original_mew_deleted_timestamp,
                            })
                        }
                        _ => Err(wasm_error!(WasmErrorInner::Guest(String::from(
                            "Expected Details::Record, got something else"
                        )))),
                    }
                }
            }
        }
        _ => Err(wasm_error!(WasmErrorInner::Guest(
            "Expecting get_details to return record, got entry".into()
        ))),
    }
}

#[hdk_extern]
pub fn get_batch_mews_with_context(hashes: Vec<ActionHash>) -> ExternResult<Vec<FeedMew>> {
    hashes
        .into_iter()
        .map(get_mew_with_context)
        .collect::<ExternResult<Vec<FeedMew>>>()
}

fn get_agent_profile(agentpubkey: AgentPubKey) -> ExternResult<Option<Profile>> {
    let zome_call_response = call(
        CallTargetCell::Local,
        "profiles",
        FunctionName::from("get_agent_profile"),
        None,
        agentpubkey,
    )?;

    match zome_call_response {
        ZomeCallResponse::Ok(response) => {
            let maybe_record: Option<Record> = response.decode().map_err(|_| {
                wasm_error!(WasmErrorInner::Guest(
                    "Failed to deserialize zome call response".into()
                ))
            })?;

            match maybe_record {
                Some(record) => {
                    let profile: Profile = record
                        .entry()
                        .to_app_option()
                        .map_err(|e| wasm_error!(WasmErrorInner::Guest(e.into())))?
                        .ok_or(wasm_error!(WasmErrorInner::Guest(String::from(
                            "Malformed Profile"
                        ))))?;

                    Ok(Some(profile))
                }
                None => Ok(None),
            }
        }
        _ => Err(wasm_error!(WasmErrorInner::Guest(
            "Failed to call 'get_agent_profile' in zome 'profiles'".into()
        ))),
    }
}
