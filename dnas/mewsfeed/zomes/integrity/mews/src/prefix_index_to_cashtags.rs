use hc_prefix_index::PrefixIndex;
use hdi::prelude::*;

pub fn validate_create_link_prefix_index_to_cashtags(
    _action: Action,
    base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    tag: LinkTag,
    tag_prefix_index: PrefixIndex,
) -> ExternResult<ValidateCallbackResult> {
    // Target should be a Mew
    let action_hash = ActionHash::try_from(target_address).map_err(|err| wasm_error!(err))?;
    let record = must_get_valid_record(action_hash)?;
    let _mew: crate::Mew = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(wasm_error!(WasmErrorInner::Guest(String::from(
            "Linked action must reference an entry"
        ))))?;

    // Tag should be a utf8 string. It is author-controlled data, so bytes that
    // don't decode are the author's fault: reject rather than error.
    let Ok(tag_string) = String::from_utf8(tag.into_inner()) else {
        return Ok(ValidateCallbackResult::Invalid(
            "Link tag must be a utf8 string".into(),
        ));
    };

    // Base address should be prefix index path matching tag prefix
    let prefix_path_hash = tag_prefix_index
        .make_result_path(tag_string, None)?
        .path_entry_hash()?;

    let base_address_entry_hash =
        EntryHash::try_from(base_address).map_err(|err| wasm_error!(err))?;
    if base_address_entry_hash != prefix_path_hash {
        return Ok(ValidateCallbackResult::Invalid(format!(
            "PrefixIndexToHashtag base address should be '{prefix_path_hash:?}'"
        )));
    }

    Ok(ValidateCallbackResult::Valid)
}

pub fn validate_delete_link_prefix_index_to_cashtags(
    _action: Action,
    _original_action: Action,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Invalid(String::from(
        "PrefixIndexToCashtags links cannot be deleted",
    )))
}
