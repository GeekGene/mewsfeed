use hdi::prelude::*;

pub fn validate_create_link_mention_to_mews(
    _action: CreateLink,
    base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    // Check the entry type for the given action hash
    let action_hash = ActionHash::from(target_address);
    let record = must_get_valid_record(action_hash)?;
    let _mew: crate::Mew = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(wasm_error!(WasmErrorInner::Guest(String::from(
            "Linked action must reference an entry"
        ))))?;

    if AgentPubKey::try_from(EntryHash::from(base_address)).is_err() {
        return Ok(ValidateCallbackResult::Invalid(
            "Base addesss of MentionToMew link must be an AgentPubKey".into(),
        ));
    }

    Ok(ValidateCallbackResult::Valid)
}

pub fn validate_delete_link_mention_to_mews(
    action: DeleteLink,
    original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    if action.author != original_action.author {
        return Ok(ValidateCallbackResult::Invalid(
            "Only the author can create their MentionToMews links".into(),
        ));
    }

    Ok(ValidateCallbackResult::Valid)
}
