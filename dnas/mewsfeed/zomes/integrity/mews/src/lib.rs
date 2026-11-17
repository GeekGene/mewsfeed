pub mod mention_to_mews;
pub use mention_to_mews::*;
pub mod mew_to_responses;
pub use mew_to_responses::*;
pub mod hashtag_to_mews;
pub use hashtag_to_mews::*;
pub mod cashtag_to_mews;
pub use cashtag_to_mews::*;
pub mod dna_properties;
pub use dna_properties::*;
pub mod agent_mews;
pub use agent_mews::*;
pub mod all_mews;
pub use all_mews::*;
pub mod prefix_index_to_cashtags;
pub use prefix_index_to_cashtags::*;
pub mod prefix_index_to_hashtags;
pub use prefix_index_to_hashtags::*;
pub mod follower_to_creators;
pub use follower_to_creators::*;
pub mod liker_to_hashes;
pub use liker_to_hashes::*;
pub mod pinner_to_hashes;
pub use pinner_to_hashes::*;
pub mod mew;
use hc_prefix_index::PrefixIndex;
use hdi::prelude::*;
pub use mew::*;
pub use mews_types::*;

pub fn make_tag_prefix_index() -> ExternResult<PrefixIndex> {
    PrefixIndex::new("prefix_index".into(), LinkTypes::PrefixIndex, 3, 3)
}

#[derive(Serialize, Deserialize)]
#[serde(tag = "type")]
#[hdk_entry_types]
#[unit_enum(UnitEntryTypes)]
pub enum EntryTypes {
    Mew(Mew),
}

#[derive(Serialize, Deserialize)]
#[hdk_link_types]
pub enum LinkTypes {
    AllMews,
    AgentMews,
    PrefixIndex,
    PrefixIndexToHashtags,
    PrefixIndexToCashtags,
    MewToResponses,
    MentionToMews,
    HashtagToMews,
    CashtagToMews,
    FollowerToCreators,
    CreatorToFollowers,
    LikerToHashes,
    HashToLikers,
    PinnerToHashes,
    HashToPinners,
}

#[hdk_extern]
pub fn genesis_self_check(_data: GenesisSelfCheckData) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}

pub fn validate_agent_joining(
    _agent_pub_key: AgentPubKey,
    _membrane_proof: &Option<MembraneProof>,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}

fn creation_from_create(action: TypedAction<CreateData>) -> TypedAction<EntryCreationData> {
    TypedAction {
        header: action.header,
        data: EntryCreationData::Create(action.data),
    }
}

fn creation_from_update(action: TypedAction<UpdateData>) -> TypedAction<EntryCreationData> {
    TypedAction {
        header: action.header,
        data: EntryCreationData::Update(action.data),
    }
}

#[hdk_extern]
pub fn validate(op: Op) -> ExternResult<ValidateCallbackResult> {
    let tag_prefix_index = make_tag_prefix_index()?;

    match op.flattened::<EntryTypes, LinkTypes>()? {
        FlatOp::CreateEntry(store_entry) => match store_entry {
            OpEntry::CreateEntry { app_entry, action } => match app_entry {
                EntryTypes::Mew(mew) => validate_create_mew(creation_from_create(action), mew),
            },
            OpEntry::UpdateEntry {
                app_entry, action, ..
            } => match app_entry {
                EntryTypes::Mew(mew) => validate_create_mew(creation_from_update(action), mew),
            },
            _ => Ok(ValidateCallbackResult::Valid),
        },
        FlatOp::Update(update_entry) => match update_entry {
            OpUpdate::Entry { app_entry, action } => match app_entry {
                EntryTypes::Mew(mew) => validate_update_mew(action, mew),
            },
            _ => Ok(ValidateCallbackResult::Valid),
        },
        FlatOp::Delete(delete_entry) => {
            let OpDelete { action } = delete_entry;
            let original_action = must_get_action(action.deletes_address.clone())?
                .hashed
                .content;
            validate_delete_mew(action, original_action)
        }
        FlatOp::Link(OpLink::CreateLink { link_type, action }) => {
            let base_address = action.base_address.clone();
            let target_address = action.target_address.clone();
            let tag = action.tag.clone();
            match link_type {
                LinkTypes::AllMews => {
                    validate_create_link_all_mews(action, base_address, target_address, tag)
                }
                LinkTypes::AgentMews => {
                    validate_create_link_agent_mews(action, base_address, target_address, tag)
                }
                LinkTypes::PrefixIndex => tag_prefix_index.validate_create_link(action),
                LinkTypes::PrefixIndexToHashtags => validate_create_link_prefix_index_to_hashtags(
                    action,
                    base_address,
                    target_address,
                    tag,
                    tag_prefix_index,
                ),
                LinkTypes::PrefixIndexToCashtags => validate_create_link_prefix_index_to_cashtags(
                    action,
                    base_address,
                    target_address,
                    tag,
                    tag_prefix_index,
                ),
                LinkTypes::MewToResponses => {
                    validate_create_link_mew_to_responses(action, base_address, target_address, tag)
                }
                LinkTypes::MentionToMews => {
                    validate_create_link_mention_to_mews(action, base_address, target_address, tag)
                }
                LinkTypes::HashtagToMews => {
                    validate_create_link_hashtag_to_mews(action, base_address, target_address, tag)
                }
                LinkTypes::CashtagToMews => {
                    validate_create_link_cashtag_to_mews(action, base_address, target_address, tag)
                }
                LinkTypes::FollowerToCreators => validate_create_link_follower_to_creators(
                    action,
                    base_address,
                    target_address,
                    tag,
                ),
                LinkTypes::CreatorToFollowers => validate_create_link_creator_to_followers(
                    action,
                    base_address,
                    target_address,
                    tag,
                ),
                LinkTypes::LikerToHashes => {
                    validate_create_link_liker_to_hashes(action, base_address, target_address, tag)
                }
                LinkTypes::HashToLikers => {
                    validate_create_link_hash_to_likers(action, base_address, target_address, tag)
                }
                LinkTypes::PinnerToHashes => {
                    validate_create_link_pinner_to_hashes(action, base_address, target_address, tag)
                }
                LinkTypes::HashToPinners => {
                    validate_create_link_hash_to_pinners(action, base_address, target_address, tag)
                }
            }
        }
        FlatOp::Link(OpLink::DeleteLink {
            link_type,
            original_action,
            action,
        }) => {
            let base_address = action.base_address.clone();
            let target_address = original_action.target_address.clone();
            let tag = original_action.tag.clone();
            match link_type {
                LinkTypes::AllMews => validate_delete_link_all_mews(
                    action,
                    original_action,
                    base_address,
                    target_address,
                    tag,
                ),
                LinkTypes::AgentMews => validate_delete_link_agent_mews(
                    action,
                    original_action,
                    base_address,
                    target_address,
                    tag,
                ),
                LinkTypes::PrefixIndex => {
                    PrefixIndex::validate_delete_link(action, original_action)
                }
                LinkTypes::PrefixIndexToHashtags => validate_delete_link_prefix_index_to_hashtags(
                    action,
                    original_action,
                    base_address,
                    target_address,
                    tag,
                ),
                LinkTypes::PrefixIndexToCashtags => validate_delete_link_prefix_index_to_cashtags(
                    action,
                    original_action,
                    base_address,
                    target_address,
                    tag,
                ),
                LinkTypes::MewToResponses => validate_delete_link_mew_to_responses(
                    action,
                    original_action,
                    base_address,
                    target_address,
                    tag,
                ),
                LinkTypes::MentionToMews => validate_delete_link_mention_to_mews(
                    action,
                    original_action,
                    base_address,
                    target_address,
                    tag,
                ),
                LinkTypes::CashtagToMews => validate_delete_link_cashtag_to_mews(
                    action,
                    original_action,
                    base_address,
                    target_address,
                    tag,
                ),
                LinkTypes::HashtagToMews => validate_delete_link_hashtag_to_mews(
                    action,
                    original_action,
                    base_address,
                    target_address,
                    tag,
                ),
                LinkTypes::FollowerToCreators => validate_delete_link_follower_to_creators(
                    action,
                    original_action,
                    base_address,
                    target_address,
                    tag,
                ),
                LinkTypes::CreatorToFollowers => validate_delete_link_creator_to_followers(
                    action,
                    original_action,
                    base_address,
                    target_address,
                    tag,
                ),
                LinkTypes::LikerToHashes => validate_delete_link_liker_to_hashes(
                    action,
                    original_action,
                    base_address,
                    target_address,
                    tag,
                ),
                LinkTypes::HashToLikers => validate_delete_link_hash_to_likers(
                    action,
                    original_action,
                    base_address,
                    target_address,
                    tag,
                ),
                LinkTypes::PinnerToHashes => validate_delete_link_pinner_to_hashes(
                    action,
                    original_action,
                    base_address,
                    target_address,
                    tag,
                ),
                LinkTypes::HashToPinners => validate_delete_link_hash_to_pinners(
                    action,
                    original_action,
                    base_address,
                    target_address,
                    tag,
                ),
            }
        }
        FlatOp::CreateRecord(store_record) => match store_record {
            OpRecord::CreateEntry { app_entry, action } => match app_entry {
                EntryTypes::Mew(mew) => validate_create_mew(creation_from_create(action), mew),
            },
            OpRecord::UpdateEntry {
                app_entry, action, ..
            } => match app_entry {
                EntryTypes::Mew(mew) => {
                    let result =
                        validate_create_mew(creation_from_update(action.clone()), mew.clone())?;
                    if let ValidateCallbackResult::Valid = result {
                        validate_update_mew(action, mew)
                    } else {
                        Ok(result)
                    }
                }
            },
            OpRecord::DeleteEntry { action } => {
                let original_action_hash = action.deletes_address.clone();
                let original_record = must_get_valid_record(original_action_hash)?;
                let original_action_full = original_record.action().clone();
                let original_action = match TypedAction::<EntryCreationData>::try_from(
                    original_action_full.clone(),
                ) {
                    Ok(original_action) => original_action,
                    Err(_) => {
                        return Ok(ValidateCallbackResult::Invalid(
                            "Original action for a delete must be a Create or Update action"
                                .to_string(),
                        ));
                    }
                };
                let app_entry_type = match original_action.entry_type() {
                    EntryType::App(app_entry_type) => app_entry_type,
                    _ => {
                        return Ok(ValidateCallbackResult::Valid);
                    }
                };
                let entry = match original_record.entry().as_option() {
                    Some(entry) => entry,
                    None => {
                        if original_action.entry_type().visibility().is_public() {
                            return Ok(
                                    ValidateCallbackResult::Invalid(
                                        "Original record for a delete of a public entry must contain an entry"
                                            .to_string(),
                                    ),
                                );
                        } else {
                            return Ok(ValidateCallbackResult::Valid);
                        }
                    }
                };
                let original_app_entry = match EntryTypes::deserialize_from_type(
                    app_entry_type.zome_index,
                    app_entry_type.entry_index,
                    entry,
                )? {
                    Some(app_entry) => app_entry,
                    None => {
                        return Ok(
                                ValidateCallbackResult::Invalid(
                                    "Original app entry must be one of the defined entry types for this zome"
                                        .to_string(),
                                ),
                            );
                    }
                };
                match original_app_entry {
                    EntryTypes::Mew(_) => validate_delete_mew(action, original_action_full),
                }
            }
            OpRecord::CreateLink { link_type, action } => {
                let base_address = action.base_address.clone();
                let target_address = action.target_address.clone();
                let tag = action.tag.clone();
                match link_type {
                    LinkTypes::AllMews => {
                        validate_create_link_all_mews(action, base_address, target_address, tag)
                    }
                    LinkTypes::AgentMews => {
                        validate_create_link_agent_mews(action, base_address, target_address, tag)
                    }
                    LinkTypes::PrefixIndex => tag_prefix_index.validate_create_link(action),
                    LinkTypes::PrefixIndexToHashtags => {
                        validate_create_link_prefix_index_to_hashtags(
                            action,
                            base_address,
                            target_address,
                            tag,
                            tag_prefix_index,
                        )
                    }
                    LinkTypes::PrefixIndexToCashtags => {
                        validate_create_link_prefix_index_to_cashtags(
                            action,
                            base_address,
                            target_address,
                            tag,
                            tag_prefix_index,
                        )
                    }
                    LinkTypes::MewToResponses => validate_create_link_mew_to_responses(
                        action,
                        base_address,
                        target_address,
                        tag,
                    ),
                    LinkTypes::MentionToMews => validate_create_link_mention_to_mews(
                        action,
                        base_address,
                        target_address,
                        tag,
                    ),
                    LinkTypes::HashtagToMews => validate_create_link_hashtag_to_mews(
                        action,
                        base_address,
                        target_address,
                        tag,
                    ),
                    LinkTypes::CashtagToMews => validate_create_link_cashtag_to_mews(
                        action,
                        base_address,
                        target_address,
                        tag,
                    ),
                    LinkTypes::FollowerToCreators => validate_create_link_follower_to_creators(
                        action,
                        base_address,
                        target_address,
                        tag,
                    ),
                    LinkTypes::CreatorToFollowers => validate_create_link_creator_to_followers(
                        action,
                        base_address,
                        target_address,
                        tag,
                    ),
                    LinkTypes::LikerToHashes => validate_create_link_liker_to_hashes(
                        action,
                        base_address,
                        target_address,
                        tag,
                    ),
                    LinkTypes::HashToLikers => validate_create_link_hash_to_likers(
                        action,
                        base_address,
                        target_address,
                        tag,
                    ),
                    LinkTypes::PinnerToHashes => validate_create_link_pinner_to_hashes(
                        action,
                        base_address,
                        target_address,
                        tag,
                    ),
                    LinkTypes::HashToPinners => validate_create_link_hash_to_pinners(
                        action,
                        base_address,
                        target_address,
                        tag,
                    ),
                }
            }
            OpRecord::DeleteLink { action } => {
                let original_action_hash = action.link_add_address.clone();
                let base_address = action.base_address.clone();
                let record = must_get_valid_record(original_action_hash)?;
                let create_link =
                    match TypedAction::<CreateLinkData>::try_from(record.action().clone()) {
                        Ok(create_link) => create_link,
                        Err(_) => {
                            return Ok(ValidateCallbackResult::Invalid(
                                "The action that a DeleteLink deletes must be a CreateLink"
                                    .to_string(),
                            ));
                        }
                    };
                let link_type =
                    match LinkTypes::from_type(create_link.zome_index, create_link.link_type)? {
                        Some(lt) => lt,
                        None => {
                            return Ok(ValidateCallbackResult::Valid);
                        }
                    };
                match link_type {
                    LinkTypes::AllMews => validate_delete_link_all_mews(
                        action,
                        create_link.clone(),
                        base_address,
                        create_link.target_address.clone(),
                        create_link.tag.clone(),
                    ),
                    LinkTypes::AgentMews => validate_delete_link_agent_mews(
                        action,
                        create_link.clone(),
                        base_address,
                        create_link.target_address.clone(),
                        create_link.tag.clone(),
                    ),
                    LinkTypes::PrefixIndex => {
                        PrefixIndex::validate_delete_link(action, create_link.clone())
                    }
                    LinkTypes::PrefixIndexToHashtags => {
                        validate_delete_link_prefix_index_to_hashtags(
                            action,
                            create_link.clone(),
                            base_address,
                            create_link.target_address.clone(),
                            create_link.tag.clone(),
                        )
                    }
                    LinkTypes::PrefixIndexToCashtags => {
                        validate_delete_link_prefix_index_to_cashtags(
                            action,
                            create_link.clone(),
                            base_address,
                            create_link.target_address.clone(),
                            create_link.tag.clone(),
                        )
                    }
                    LinkTypes::MewToResponses => validate_delete_link_mew_to_responses(
                        action,
                        create_link.clone(),
                        base_address,
                        create_link.target_address.clone(),
                        create_link.tag.clone(),
                    ),
                    LinkTypes::MentionToMews => validate_delete_link_mention_to_mews(
                        action,
                        create_link.clone(),
                        base_address,
                        create_link.target_address.clone(),
                        create_link.tag.clone(),
                    ),
                    LinkTypes::CashtagToMews => validate_delete_link_cashtag_to_mews(
                        action,
                        create_link.clone(),
                        base_address,
                        create_link.target_address.clone(),
                        create_link.tag.clone(),
                    ),
                    LinkTypes::HashtagToMews => validate_delete_link_hashtag_to_mews(
                        action,
                        create_link.clone(),
                        base_address,
                        create_link.target_address.clone(),
                        create_link.tag.clone(),
                    ),
                    LinkTypes::FollowerToCreators => validate_delete_link_follower_to_creators(
                        action,
                        create_link.clone(),
                        base_address,
                        create_link.target_address.clone(),
                        create_link.tag.clone(),
                    ),
                    LinkTypes::CreatorToFollowers => validate_delete_link_creator_to_followers(
                        action,
                        create_link.clone(),
                        base_address,
                        create_link.target_address.clone(),
                        create_link.tag.clone(),
                    ),
                    LinkTypes::LikerToHashes => validate_delete_link_liker_to_hashes(
                        action,
                        create_link.clone(),
                        base_address,
                        create_link.target_address.clone(),
                        create_link.tag.clone(),
                    ),
                    LinkTypes::HashToLikers => validate_delete_link_hash_to_likers(
                        action,
                        create_link.clone(),
                        base_address,
                        create_link.target_address.clone(),
                        create_link.tag.clone(),
                    ),
                    LinkTypes::PinnerToHashes => validate_delete_link_pinner_to_hashes(
                        action,
                        create_link.clone(),
                        base_address,
                        create_link.target_address.clone(),
                        create_link.tag.clone(),
                    ),
                    LinkTypes::HashToPinners => validate_delete_link_hash_to_pinners(
                        action,
                        create_link.clone(),
                        base_address,
                        create_link.target_address.clone(),
                        create_link.tag.clone(),
                    ),
                }
            }
            OpRecord::CreatePrivateEntry { .. } => Ok(ValidateCallbackResult::Valid),
            OpRecord::UpdatePrivateEntry { .. } => Ok(ValidateCallbackResult::Valid),
            OpRecord::CreateCapClaim { .. } => Ok(ValidateCallbackResult::Valid),
            OpRecord::CreateCapGrant { .. } => Ok(ValidateCallbackResult::Valid),
            OpRecord::UpdateCapClaim { .. } => Ok(ValidateCallbackResult::Valid),
            OpRecord::UpdateCapGrant { .. } => Ok(ValidateCallbackResult::Valid),
            OpRecord::Dna { .. } => Ok(ValidateCallbackResult::Valid),
            OpRecord::OpenChain { .. } => Ok(ValidateCallbackResult::Valid),
            OpRecord::CloseChain { .. } => Ok(ValidateCallbackResult::Valid),
            OpRecord::InitZomesComplete { .. } => Ok(ValidateCallbackResult::Valid),
            _ => Ok(ValidateCallbackResult::Valid),
        },
        FlatOp::AgentActivity(agent_activity) => match agent_activity {
            OpActivity::CreateAgent { agent, action } => {
                let prev_action_hash =
                    action
                        .prev_action()
                        .cloned()
                        .ok_or(wasm_error!(WasmErrorInner::Guest(
                            "A `CreateAgent` action must have a previous action".into()
                        )))?;
                let previous_action = must_get_action(prev_action_hash)?;
                match &previous_action.action().data {
                        ActionData::AgentValidationPkg(
                            AgentValidationPkgData { membrane_proof, .. },
                        ) => validate_agent_joining(agent, membrane_proof),
                        _ => {
                            Ok(
                                ValidateCallbackResult::Invalid(
                                    "The previous action for a `CreateAgent` action must be an `AgentValidationPkg`"
                                        .to_string(),
                                ),
                            )
                        }
                    }
            }
            _ => Ok(ValidateCallbackResult::Valid),
        },
    }
}
