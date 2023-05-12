use hdi::prelude::*;
use hdk::prelude::Path;

pub fn validate_create_link_all_mews(
    _action: CreateLink,
    base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    let action_hash = ActionHash::from(target_address);
    let record = must_get_valid_record(action_hash)?;
    let _mew: crate::Mew = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(wasm_error!(WasmErrorInner::Guest(String::from(
            "Linked action must reference an entry"
        ))))?;

    let expected_base_address = Path::from("all_mews").path_entry_hash()?;
    if EntryHash::from(base_address) != expected_base_address {
        return Ok(ValidateCallbackResult::Invalid(
            "AllMews link must use 'all_mews' Path as its base".into(),
        ));
    }

    Ok(ValidateCallbackResult::Valid)
}

pub fn validate_delete_link_all_mews(
    action: DeleteLink,
    original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    if action.author != original_action.author {
        return Ok(ValidateCallbackResult::Invalid(
            "Only the original action author can delete their AllMews link".into(),
        ))
    }
    
    Ok(ValidateCallbackResult::Valid)
}
