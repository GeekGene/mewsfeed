use crate::licker_to_mews::*;
use crate::liker_to_hashes::IsLikerForHashInput;
use crate::mew_to_responses::*;
use crate::pinner_to_mews::get_is_hash_pinned;
use hc_zome_input::ZomeFnInput;
use hdk::prelude::*;
use mews_integrity::*;

#[hdk_extern]
pub fn get_mew_with_context(input: ZomeFnInput<ActionHash>) -> ExternResult<FeedMew> {
    let get_options = input.get_options();
    get_mew_with_context_internal(input.input, get_options)
}

pub fn get_mew_with_context_internal(
    original_mew_hash: ActionHash,
    get_options: GetOptions,
) -> ExternResult<FeedMew> {
    let response = get_details(original_mew_hash.clone(), get_options.clone())?.ok_or(
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

            let replies_count = count_responses_for_mew(CountResponsesForMewInput {
                original_mew_hash: original_mew_hash.clone(),
                response_type: Some(ResponseType::Reply),
            })?;
            let is_replied = get_response_for_mew_exists(GetResponseForMewExistsInput {
                original_mew_hash: original_mew_hash.clone(),
                response_type: Some(ResponseType::Reply),
                response_author: my_pubkey.clone(),
            })?;

            let quotes_count = count_responses_for_mew(CountResponsesForMewInput {
                original_mew_hash: original_mew_hash.clone(),
                response_type: Some(ResponseType::Quote),
            })?;
            let is_quoted = get_response_for_mew_exists(GetResponseForMewExistsInput {
                original_mew_hash: original_mew_hash.clone(),
                response_type: Some(ResponseType::Quote),
                response_author: my_pubkey.clone(),
            })?;

            let mewmews_count = count_responses_for_mew(CountResponsesForMewInput {
                original_mew_hash: original_mew_hash.clone(),
                response_type: Some(ResponseType::Mewmew),
            })?;
            let is_mewmewed = get_response_for_mew_exists(GetResponseForMewExistsInput {
                original_mew_hash: original_mew_hash.clone(),
                response_type: Some(ResponseType::Mewmew),
                response_author: my_pubkey.clone(),
            })?;

            let licks_count = count_lickers_for_mew(original_mew_hash.clone())?;
            let is_licked = is_licker_for_mew(IsLikerForHashInput {
                liker: my_pubkey,
                hash: original_mew_hash.into(),
            })?;

            let deleted_timestamp = deletes
                .first()
                .map(|first_delete| first_delete.action().timestamp());
            let is_pinned = get_is_hash_pinned(record.action_hashed().hash.clone())?;

            match mew.clone().mew_type {
                MewType::Original => Ok(FeedMew {
                    mew,
                    action: record.action().clone(),
                    action_hash: record.signed_action().as_hash().clone(),
                    replies_count,
                    quotes_count,
                    licks_count,
                    mewmews_count,
                    deleted_timestamp,
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
                    let original_mew_embed =
                        match get_details(response_to_hash.clone(), get_options) {
                            Ok(Some(Details::Record(record_details))) => {
                                let original_mew_deleted_timestamp = record_details
                                    .deletes
                                    .first()
                                    .map(|first_delete| first_delete.action().timestamp());

                                match record_details.record.entry().to_app_option::<Mew>() {
                                    Ok(Some(original_mew)) => Some(EmbedMew {
                                        mew: original_mew,
                                        action: record_details.record.action().clone(),
                                        action_hash: record_details
                                            .record
                                            .action_hashed()
                                            .clone()
                                            .hash,
                                        deleted_timestamp: original_mew_deleted_timestamp,
                                    }),
                                    _ => {
                                        debug!(
                                            "Malformed original mew {:?}, returning None",
                                            response_to_hash
                                        );
                                        None
                                    }
                                }
                            }
                            _ => {
                                debug!(
                                    "Original mew {:?} unavailable, returning None",
                                    response_to_hash
                                );
                                None
                            }
                        };

                    Ok(FeedMew {
                        mew,
                        action: record.action().clone(),
                        action_hash: record.signed_action().as_hash().clone(),
                        replies_count,
                        quotes_count,
                        licks_count,
                        mewmews_count,
                        deleted_timestamp,
                        is_pinned,
                        is_licked,
                        is_mewmewed,
                        is_replied,
                        is_quoted,
                        original_mew: original_mew_embed,
                    })
                }
            }
        }
        _ => Err(wasm_error!(WasmErrorInner::Guest(
            "Expecting get_details to return record, got entry".into()
        ))),
    }
}

#[hdk_extern]
pub fn get_batch_mews_with_context(
    input: ZomeFnInput<Vec<ActionHash>>,
) -> ExternResult<Vec<FeedMew>> {
    let get_options = input.get_options();
    get_batch_mews_with_context_internal(input.input, get_options)
}

pub fn get_batch_mews_with_context_internal(
    hashes: Vec<ActionHash>,
    get_options: GetOptions,
) -> ExternResult<Vec<FeedMew>> {
    Ok(hashes
        .into_iter()
        .filter_map(
            |hash| match get_mew_with_context_internal(hash.clone(), get_options.clone()) {
                Ok(feed_mew) => Some(feed_mew),
                Err(e) => {
                    debug!("Skipping unavailable mew {:?}: {:?}", hash, e);
                    None
                }
            },
        )
        .collect())
}

#[hdk_extern]
pub fn get_responses_for_mew_with_context(
    input: ZomeFnInput<GetResponsesForMewInput>,
) -> ExternResult<Vec<FeedMew>> {
    let get_options = input.get_options();
    let response_hashes = get_response_hashes_for_mew(input)?;

    get_batch_mews_with_context_internal(response_hashes, get_options)
}
