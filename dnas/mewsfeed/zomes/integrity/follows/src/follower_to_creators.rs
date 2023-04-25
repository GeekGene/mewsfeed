use hdi::prelude::*;
pub fn validate_create_link_follower_to_creators(
    action: CreateLink,
    base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    if base_address == target_address {
        return Ok(ValidateCallbackResult::Invalid("You cannot follow yourself".into()));
    }
    if base_address != AnyLinkableHash::from(action.author) {
        return Ok(ValidateCallbackResult::Invalid("You cannot change who others follow".into()));
    }

    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_link_follower_to_creators(
    action: DeleteLink,
    original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    if action.author != original_action.author {
        return Ok(ValidateCallbackResult::Invalid("You cannot change who others unfollow".into()));
    }

    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_create_link_creator_to_followers(
    action: CreateLink,
    base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    if base_address == target_address {
        return Ok(ValidateCallbackResult::Invalid("You cannot follow yourself".into()));
    }
    if target_address != AnyLinkableHash::from(action.author) {
        return Ok(ValidateCallbackResult::Invalid("You cannot change who another agent follows".into()));
    }

    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_link_creator_to_followers(
    action: DeleteLink,
    original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    if action.author != original_action.author {
        return Ok(ValidateCallbackResult::Invalid("You cannot change who others unfollow".into()));
    }
    
    Ok(ValidateCallbackResult::Valid)
}
