use hdi::prelude::*;
use crate::make_prefix_path;

pub fn validate_create_link_prefix_index_to_hashtags(
    _action: CreateLink,
    base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    // Target should be a Mew
    let action_hash = ActionHash::from(target_address.clone());
    let record = must_get_valid_record(action_hash)?;
    let _mew: crate::Mew = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Linked action must reference an entry"))
            ),
        )?;

    // Tag should be a utf8 string
    let tag_string = String::from_utf8(tag.into_inner()).map_err(|_| wasm_error!(WasmErrorInner::Guest("Failed to deserialize link tag to string".into())))?;
    
    // Base address should be prefix index path matching tag prefix
    let prefix_path_hash = make_prefix_path(tag_string)?.path_entry_hash()?;
    
    if EntryHash::from(base_address) != prefix_path_hash {
        return Ok(ValidateCallbackResult::Invalid(format!("PrefixIndexToHashtag base address should be '{:?}'", prefix_path_hash).into()))
    }

    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_link_prefix_index_to_hashtags(
    _action: DeleteLink,
    _original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Invalid(String::from("PrefixIndexToHashtags links cannot be deleted")))
}
