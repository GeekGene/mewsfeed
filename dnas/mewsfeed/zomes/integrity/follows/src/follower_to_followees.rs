use hdi::prelude::*;
pub fn validate_create_link_follower_to_followees(
    _action: CreateLink,
    base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    if base_address == target_address {
        return Ok(ValidateCallbackResult::Invalid("You cannot follow yourself".into()));
    }

    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_link_follower_to_followees(
    action: DeleteLink,
    original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    if action.author != original_action.author {
        return Ok(ValidateCallbackResult::Invalid("Only the original follower can unfollow someone".into()));
    }

    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_create_link_followee_to_followers(
    _action: CreateLink,
    base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    if base_address == target_address {
        return Ok(ValidateCallbackResult::Invalid("You cannot follow yourself".into()));
    }

    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_link_followee_to_followers(
    action: DeleteLink,
    original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    if action.author != original_action.author {
        return Ok(ValidateCallbackResult::Invalid("Only the original follower can unfollow someone".into()));
    }

    Ok(ValidateCallbackResult::Valid)
}
