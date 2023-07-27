use crate::licker_to_mews::*;
use crate::mew_to_responses::*;
use crate::pinner_to_mews::get_is_hash_pinned;
use hc_call_utils::call_local_zome;
use hdk::prelude::*;
use mews_integrity::*;
use mews_types::Profile;

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
            let my_pubkey = agent_info()?.agent_initial_pubkey;

            let replies_count = get_response_count_for_mew(GetResponseCountForMewInput {
                original_mew_hash: original_mew_hash.clone(),
                response_type: Some(ResponseType::Reply),
            })?;
            let is_replied = get_response_for_mew_exists(GetResponseForMewExistsInput {
                original_mew_hash: original_mew_hash.clone(),
                response_type: Some(ResponseType::Reply),
                response_author: my_pubkey.clone(),
            })?;

            let quotes_count = get_response_count_for_mew(GetResponseCountForMewInput {
                original_mew_hash: original_mew_hash.clone(),
                response_type: Some(ResponseType::Quote),
            })?;
            let is_quoted = get_response_for_mew_exists(GetResponseForMewExistsInput {
                original_mew_hash: original_mew_hash.clone(),
                response_type: Some(ResponseType::Quote),
                response_author: my_pubkey.clone(),
            })?;

            let mewmews_count = get_response_count_for_mew(GetResponseCountForMewInput {
                original_mew_hash: original_mew_hash.clone(),
                response_type: Some(ResponseType::Mewmew),
            })?;
            let is_mewmewed = get_response_for_mew_exists(GetResponseForMewExistsInput {
                original_mew_hash: original_mew_hash.clone(),
                response_type: Some(ResponseType::Mewmew),
                response_author: my_pubkey.clone(),
            })?;
            
            let licks = get_lickers_for_mew(original_mew_hash)?;
            let is_licked = licks.contains(&my_pubkey);

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
                    replies_count,
                    quotes_count,
                    licks_count: licks.len(),
                    mewmews_count,
                    deleted_timestamp,
                    author_profile,
                    is_pinned,
                    is_licked,
                    is_mewmewed,
                    is_replied,
                    is_quoted,
                    original_mew: None,
                }),
                MewType::Reply(response_to_hash)
                | MewType::Quote(response_to_hash)
                | MewType::Mewmew(response_to_hash) => {
                    let details = get_details(response_to_hash, GetOptions::default())?.ok_or(
                        wasm_error!(WasmErrorInner::Guest(String::from("Mew not found"))),
                    )?;

                    match details {
                        Details::Record(record_details) => {
                            let original_mew_author_profile =
                                get_agent_profile(record_details.record.action().author().clone())?;
                            let original_mew_deleted_timestamp = record_details
                                .deletes
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
                                replies_count,
                                quotes_count,
                                licks_count: licks.len(),
                                mewmews_count,
                                author_profile,
                                deleted_timestamp,
                                is_pinned,
                                is_licked,
                                is_mewmewed,
                                is_replied,
                                is_quoted,
                                original_mew: Some(EmbedMew {
                                    mew: original_mew,
                                    action: record_details.record.action().clone(),
                                    action_hash: record_details.record.action_hashed().clone().hash,
                                    author_profile: original_mew_author_profile,
                                    deleted_timestamp: original_mew_deleted_timestamp,
                                }),
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

#[hdk_extern]
pub fn get_responses_for_mew_with_context(
    input: GetResponsesForMewInput,
) -> ExternResult<Vec<FeedMew>> {
    let response_hashes = get_response_hashes_for_mew(input)?;

    get_batch_mews_with_context(response_hashes)
}

fn get_agent_profile(agent_pub_key: AgentPubKey) -> ExternResult<Option<Profile>> {
    let maybe_record = call_local_zome::<Option<Record>, AgentPubKey>(
        "profiles",
        "get_agent_profile",
        agent_pub_key,
    )?;

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
