use crate::PREFIX_INDEX_WIDTH;
use hdk::hash_path::path::{root_hash, Component};
use hdk::prelude::*;

pub fn validate_create_link_prefix_index(
    _action: CreateLink,
    base_address: AnyLinkableHash,
    _target_address: AnyLinkableHash,
    tag: LinkTag,
    index_name: impl Into<String> + Clone,
) -> ExternResult<ValidateCallbackResult> {
    let tag_bytes = SerializedBytes::try_from(UnsafeBytes::from(tag.into_inner()))
        .map_err(|_| wasm_error!("Failed to convert link tag to SerializedBytes"))?;
    let tag_component = Component::try_from(tag_bytes).map_err(|e| wasm_error!(e))?;
    let tag_string = String::try_from(&tag_component).map_err(|e| wasm_error!(e))?;

    if base_address == root_hash()? {
        // First component
        if tag_string != index_name.clone().into() {
            return Ok(ValidateCallbackResult::Invalid(format!(
                "PrefixIndex first component must be '{}'",
                index_name.into()
            )));
        }
    } else if EntryHash::from(base_address) == Path::from(index_name.into()).path_entry_hash()? {
        // Second component
        if tag_string.chars().count() != *PREFIX_INDEX_WIDTH {
            return Ok(ValidateCallbackResult::Invalid(format!(
                "PrefixIndex second component must be length {:?}",
                *PREFIX_INDEX_WIDTH
            )));
        }
    } else {
        return Ok(ValidateCallbackResult::Invalid("A prefix path can only have two components".into()));
    }

    Ok(ValidateCallbackResult::Valid)
}

pub fn validate_delete_link_prefix_index(
    _action: DeleteLink,
    _original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Invalid(String::from(
        "PrefixIndex links cannot be deleted",
    )))
}
