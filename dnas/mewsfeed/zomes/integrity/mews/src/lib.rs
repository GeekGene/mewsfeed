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
pub mod mew;
use hdi::prelude::*;
pub use mew::*;
use prefix_index::PrefixIndex;

pub fn make_tag_prefix_index() -> ExternResult<PrefixIndex> {
    PrefixIndex::new("prefix_index".into(), LinkTypes::PrefixIndex, 3, 3)
}

#[derive(Serialize, Deserialize)]
#[serde(tag = "type")]
#[hdk_entry_defs]
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

#[hdk_extern]
pub fn validate(op: Op) -> ExternResult<ValidateCallbackResult> {
    let tag_prefix_index = make_tag_prefix_index()?;

    match op.flattened::<EntryTypes, LinkTypes>()? {
        FlatOp::StoreEntry(store_entry) => match store_entry {
            OpEntry::CreateEntry { app_entry, action } => match app_entry {
                EntryTypes::Mew(mew) => {
                    validate_create_mew(EntryCreationAction::Create(action), mew)
                }
            },
            OpEntry::UpdateEntry {
                app_entry, action, ..
            } => match app_entry {
                EntryTypes::Mew(mew) => {
                    validate_create_mew(EntryCreationAction::Update(action), mew)
                }
            },
            _ => Ok(ValidateCallbackResult::Valid),
        },
        FlatOp::RegisterUpdate(update_entry) => match update_entry {
            OpUpdate::Entry {
                original_action,
                original_app_entry,
                app_entry,
                action,
            } => match (app_entry, original_app_entry) {
                (EntryTypes::Mew(mew), EntryTypes::Mew(original_mew)) => {
                    validate_update_mew(action, mew, original_action, original_mew)
                }
            },
            _ => Ok(ValidateCallbackResult::Valid),
        },
        FlatOp::RegisterDelete(delete_entry) => match delete_entry {
            OpDelete::Entry {
                original_action,
                original_app_entry,
                action,
            } => match original_app_entry {
                EntryTypes::Mew(mew) => validate_delete_mew(action, original_action, mew),
            },
            _ => Ok(ValidateCallbackResult::Valid),
        },
        FlatOp::RegisterCreateLink {
            link_type,
            base_address,
            target_address,
            tag,
            action,
        } => match link_type {
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
        },
        FlatOp::RegisterDeleteLink {
            link_type,
            base_address,
            target_address,
            tag,
            original_action,
            action,
        } => match link_type {
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
                tag_prefix_index.validate_delete_link(action, original_action)
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
        },
        FlatOp::StoreRecord(store_record) => match store_record {
            OpRecord::CreateEntry { app_entry, action } => match app_entry {
                EntryTypes::Mew(mew) => {
                    validate_create_mew(EntryCreationAction::Create(action), mew)
                }
            },
            OpRecord::UpdateEntry {
                original_action_hash,
                app_entry,
                action,
                ..
            } => {
                let original_record = must_get_valid_record(original_action_hash)?;
                let original_action = original_record.action().clone();
                let original_action = match original_action {
                    Action::Create(create) => EntryCreationAction::Create(create),
                    Action::Update(update) => EntryCreationAction::Update(update),
                    _ => {
                        return Ok(ValidateCallbackResult::Invalid(
                            "Original action for an update must be a Create or Update action"
                                .to_string(),
                        ));
                    }
                };
                match app_entry {
                    EntryTypes::Mew(mew) => {
                        let result = validate_create_mew(
                            EntryCreationAction::Update(action.clone()),
                            mew.clone(),
                        )?;
                        if let ValidateCallbackResult::Valid = result {
                            let original_mew: Option<Mew> = original_record
                                .entry()
                                .to_app_option()
                                .map_err(|e| wasm_error!(e))?;
                            let original_mew = match original_mew {
                                Some(mew) => mew,
                                None => {
                                    return Ok(
                                            ValidateCallbackResult::Invalid(
                                                "The updated entry type must be the same as the original entry type"
                                                    .to_string(),
                                            ),
                                        );
                                }
                            };
                            validate_update_mew(action, mew, original_action, original_mew)
                        } else {
                            Ok(result)
                        }
                    }
                }
            }
            OpRecord::DeleteEntry {
                original_action_hash,
                action,
                ..
            } => {
                let original_record = must_get_valid_record(original_action_hash)?;
                let original_action = original_record.action().clone();
                let original_action = match original_action {
                    Action::Create(create) => EntryCreationAction::Create(create),
                    Action::Update(update) => EntryCreationAction::Update(update),
                    _ => {
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
                    EntryTypes::Mew(original_mew) => {
                        validate_delete_mew(action, original_action, original_mew)
                    }
                }
            }
            OpRecord::CreateLink {
                base_address,
                target_address,
                tag,
                link_type,
                action,
            } => match link_type {
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
            },
            OpRecord::DeleteLink {
                original_action_hash,
                base_address,
                action,
            } => {
                let record = must_get_valid_record(original_action_hash)?;
                let create_link = match record.action() {
                    Action::CreateLink(create_link) => create_link.clone(),
                    _ => {
                        return Ok(ValidateCallbackResult::Invalid(
                            "The action that a DeleteLink deletes must be a CreateLink".to_string(),
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
                        create_link.target_address,
                        create_link.tag,
                    ),
                    LinkTypes::AgentMews => validate_delete_link_agent_mews(
                        action,
                        create_link.clone(),
                        base_address,
                        create_link.target_address,
                        create_link.tag,
                    ),
                    LinkTypes::PrefixIndex => {
                        tag_prefix_index.validate_delete_link(action, create_link)
                    }
                    LinkTypes::PrefixIndexToHashtags => {
                        validate_delete_link_prefix_index_to_hashtags(
                            action,
                            create_link.clone(),
                            base_address,
                            create_link.target_address,
                            create_link.tag,
                        )
                    }
                    LinkTypes::PrefixIndexToCashtags => {
                        validate_delete_link_prefix_index_to_cashtags(
                            action,
                            create_link.clone(),
                            base_address,
                            create_link.target_address,
                            create_link.tag,
                        )
                    }
                    LinkTypes::MewToResponses => validate_delete_link_mew_to_responses(
                        action,
                        create_link.clone(),
                        base_address,
                        create_link.target_address,
                        create_link.tag,
                    ),
                    LinkTypes::MentionToMews => validate_delete_link_mention_to_mews(
                        action,
                        create_link.clone(),
                        base_address,
                        create_link.target_address,
                        create_link.tag,
                    ),
                    LinkTypes::CashtagToMews => validate_delete_link_cashtag_to_mews(
                        action,
                        create_link.clone(),
                        base_address,
                        create_link.target_address,
                        create_link.tag,
                    ),
                    LinkTypes::HashtagToMews => validate_delete_link_hashtag_to_mews(
                        action,
                        create_link.clone(),
                        base_address,
                        create_link.target_address,
                        create_link.tag,
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
        FlatOp::RegisterAgentActivity(agent_activity) => match agent_activity {
            OpActivity::CreateAgent { agent, action } => {
                let previous_action = must_get_action(action.prev_action)?;
                match previous_action.action() {
                        Action::AgentValidationPkg(
                            AgentValidationPkg { membrane_proof, .. },
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
