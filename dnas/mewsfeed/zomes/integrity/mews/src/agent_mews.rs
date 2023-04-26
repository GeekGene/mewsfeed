use hdi::prelude::*;

pub fn validate_create_link_agent_mews(
    action: CreateLink,
    base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    let action_hash = ActionHash::from(target_address);
    let record: Record = must_get_valid_record(action_hash)?;
    let _mew: crate::Mew = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(wasm_error!(WasmErrorInner::Guest(String::from(
            "Linked action must reference an entry"
        ))))?;

    if AnyLinkableHash::from(action.author) != base_address {
        return Ok(ValidateCallbackResult::Invalid(
            "Only the author can create their AgentMews links".into(),
        ));
    }

    Ok(ValidateCallbackResult::Valid)
}

pub fn validate_delete_link_agent_mews(
    action: DeleteLink,
    original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    if action.author != original_action.author {
        return Ok(ValidateCallbackResult::Invalid(
            "Only the original action author can delete their link".into(),
        ));
    }

    Ok(ValidateCallbackResult::Valid)
}
