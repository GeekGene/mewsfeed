use crate::dna_properties::*;
use hdi::prelude::*;
use mews_types::*;

pub fn validate_create_mew(
    action: TypedAction<EntryCreationData>,
    mew: Mew,
) -> ExternResult<ValidateCallbackResult> {
    let properties = get_dna_properties(())?;

    // Validate min & max mew length by DNA properties setting
    match mew.mew_type {
        MewType::Original | MewType::Reply(_) | MewType::Quote(_) => {
            if let Some(mew_characters_min) = properties.mew_characters_min {
                if mew.text.len() < mew_characters_min {
                    return Ok(ValidateCallbackResult::Invalid(format!(
                        "mew must contain at least {mew_characters_min} characters"
                    )));
                }
            }

            // Validate maximum mew length, if set in DNA properties
            if let Some(mew_characters_max) = properties.mew_characters_max {
                if mew.text.len() > mew_characters_max {
                    return Ok(ValidateCallbackResult::Invalid(format!(
                        "mew must contain at most {mew_characters_max} characters"
                    )));
                }
            }
        }
        MewType::Mewmew(original_mew_ah) => {
            if !mew.text.is_empty() {
                return Ok(ValidateCallbackResult::Invalid(
                    "Mewmew cannot contain text".into(),
                ));
            }

            if action.action_seq() > 5 {
                let prev_action_hash =
                    action
                        .prev_action()
                        .cloned()
                        .ok_or(wasm_error!(WasmErrorInner::Guest(
                            "Mew action must have a previous action".to_string()
                        )))?;
                let agent_activity = must_get_agent_activity(
                    action.author().clone(),
                    ChainFilter::new(prev_action_hash).include_cached_entries(),
                )?;

                let has_identical_mewmews = agent_activity
                    .into_iter()
                    .filter_map(|agent_activity| {
                        match agent_activity.action.action().action_type() {
                            ActionType::Create => agent_activity
                                .action
                                .clone()
                                .action()
                                .entry_type()
                                .and_then(|entry_type: &EntryType| match entry_type.clone() {
                                    EntryType::App(app_entry_def) => {
                                        match (app_entry_def.zome_index, app_entry_def.entry_index)
                                        {
                                            (ZomeIndex(1), EntryDefIndex(0)) => {
                                                Some(agent_activity)
                                            }
                                            _ => None,
                                        }
                                    }
                                    _ => None,
                                }),
                            _ => None,
                        }
                    })
                    .filter_map(|agent_activity| {
                        agent_activity
                            .action
                            .action()
                            .entry_data()
                            .and_then(|(entry_hash, ..)| {
                                must_get_entry(entry_hash.clone())
                                    .ok()
                                    .and_then(|entry| Mew::try_from(entry.as_content()).ok())
                            })
                    })
                    .any(|mew| match mew.mew_type {
                        MewType::Mewmew(ah) => ah == original_mew_ah,
                        _ => false,
                    });

                if has_identical_mewmews {
                    return Ok(ValidateCallbackResult::Invalid(
                        "A mew can only be mewmewed once".into(),
                    ));
                }
            }
        }
    }

    Ok(ValidateCallbackResult::Valid)
}

pub fn validate_update_mew(
    _action: TypedAction<UpdateData>,
    _mew: Mew,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Invalid(
        "Mews cannot be updated".into(),
    ))
}

pub fn validate_delete_mew(
    action: TypedAction<DeleteData>,
    original_action: Action,
) -> ExternResult<ValidateCallbackResult> {
    if action.author() != original_action.author() {
        return Ok(ValidateCallbackResult::Invalid(
            "Only the original action author can delete their mew".into(),
        ));
    }

    Ok(ValidateCallbackResult::Valid)
}
