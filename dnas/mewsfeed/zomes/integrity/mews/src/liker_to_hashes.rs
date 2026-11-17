use hdi::prelude::*;
pub fn validate_create_link_liker_to_hashes(
    action: Action,
    base_address: AnyLinkableHash,
    _target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    if base_address != AnyLinkableHash::from(action.author().clone()) {
        return Ok(ValidateCallbackResult::Invalid(
            "You cannot change who others like".into(),
        ));
    }

    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_link_liker_to_hashes(
    action: Action,
    original_action: Action,
) -> ExternResult<ValidateCallbackResult> {
    if action.author() != original_action.author() {
        return Ok(ValidateCallbackResult::Invalid(
            "You cannot change who others unlike".into(),
        ));
    }

    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_create_link_hash_to_likers(
    action: Action,
    _base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    if target_address != AnyLinkableHash::from(action.author().clone()) {
        return Ok(ValidateCallbackResult::Invalid(
            "You cannot change who others like".into(),
        ));
    }

    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_link_hash_to_likers(
    action: Action,
    original_action: Action,
) -> ExternResult<ValidateCallbackResult> {
    if action.author() != original_action.author() {
        return Ok(ValidateCallbackResult::Invalid(
            "You cannot change who others unlike".into(),
        ));
    }

    Ok(ValidateCallbackResult::Valid)
}
