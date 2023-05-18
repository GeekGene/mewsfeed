use hdi::prelude::*;
pub fn validate_create_link_pinner_to_hashes(
    action: CreateLink,
    base_address: AnyLinkableHash,
    _target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    if base_address != AnyLinkableHash::from(action.author) {
        return Ok(ValidateCallbackResult::Invalid(
            "You cannot change what others pnin".into(),
        ));
    }

    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_link_pinner_to_hashes(
    action: DeleteLink,
    original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    if action.author != original_action.author {
        return Ok(ValidateCallbackResult::Invalid(
            "You cannot change who others unpin".into(),
        ));
    }

    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_create_link_hash_to_pinners(
    action: CreateLink,
    _base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    if target_address != AnyLinkableHash::from(action.author) {
        return Ok(ValidateCallbackResult::Invalid(
            "You cannot change what others pnin".into(),
        ));
    }

    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_link_hash_to_pinners(
    action: DeleteLink,
    original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    if action.author != original_action.author {
        return Ok(ValidateCallbackResult::Invalid(
            "You cannot change who others unpin".into(),
        ));
    }

    Ok(ValidateCallbackResult::Valid)
}
