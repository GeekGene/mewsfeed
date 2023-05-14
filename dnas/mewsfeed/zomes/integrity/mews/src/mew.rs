use crate::dna_properties::*;
use hdi::prelude::*;
use mews_types::*;

pub fn validate_create_mew(
    _action: EntryCreationAction,
    mew: Mew,
) -> ExternResult<ValidateCallbackResult> {
    let properties = get_dna_properties(())?;

    // Validate min & max mew length by DNA properties setting
    match mew.mew_type {
        MewType::Original | MewType::Reply(_) | MewType::Quote(_) => {
            if let Some(mew_characters_min) = properties.mew_characters_min {
                if mew.text.len() < mew_characters_min {
                    return Ok(ValidateCallbackResult::Invalid(format!(
                        "mew must contain at least {} characters",
                        mew_characters_min
                    )));
                }
            }

            // Validate maximum mew length, if set in DNA properties
            if let Some(mew_characters_max) = properties.mew_characters_max {
                if mew.text.len() > mew_characters_max {
                    return Ok(ValidateCallbackResult::Invalid(format!(
                        "mew must contain at most {} characters",
                        mew_characters_max
                    )));
                }
            }
        }
        MewType::Mewmew(_) => {
            if !mew.text.is_empty() {
                return Ok(ValidateCallbackResult::Invalid(
                    "Mewmew cannot contain text".into(),
                ));
            }
        }
    }

    Ok(ValidateCallbackResult::Valid)
}

pub fn validate_update_mew(
    _action: Update,
    _mew: Mew,
    _original_action: EntryCreationAction,
    _original_mew: Mew,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Invalid(
        "Mews cannot be updated".into(),
    ))
}

pub fn validate_delete_mew(
    action: Delete,
    original_action: EntryCreationAction,
    _original_mew: Mew,
) -> ExternResult<ValidateCallbackResult> {
    if action.author != *original_action.author() {
        return Ok(ValidateCallbackResult::Invalid(
            "Only the original action author can delete their mew".into(),
        ));
    }

    Ok(ValidateCallbackResult::Valid)
}
