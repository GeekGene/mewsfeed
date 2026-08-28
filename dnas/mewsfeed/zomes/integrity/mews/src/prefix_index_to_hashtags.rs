use crate::prefix_index_to_tags::validate_create_link_prefix_index_to_tag;
use hc_prefix_index::PrefixIndex;
use hdi::prelude::*;

pub fn validate_create_link_prefix_index_to_hashtags(
    _action: Action,
    base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    tag: LinkTag,
    tag_prefix_index: PrefixIndex,
) -> ExternResult<ValidateCallbackResult> {
    validate_create_link_prefix_index_to_tag(
        base_address,
        target_address,
        tag,
        tag_prefix_index,
        "PrefixIndexToHashtags",
    )
}

pub fn validate_delete_link_prefix_index_to_hashtags(
    _action: Action,
    _original_action: Action,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Invalid(String::from(
        "PrefixIndexToHashtags links cannot be deleted",
    )))
}
