use hc_prefix_index::PrefixIndex;
use hdi::prelude::*;

/// Shared validation for the links that hang a tag off the tag prefix index.
///
/// Everything this reads — the link's base, target, and tag — is author
/// controlled, so malformed values are rejected with `Invalid` rather than
/// erroring the callback. An error is not a verdict: it leaves the op
/// unresolvable and the author unwarranted, and authorities re-run the
/// callback. `must_get_valid_record` is the exception: its error is how a
/// validation callback signals an unresolved dependency.
pub(crate) fn validate_create_link_prefix_index_to_tag(
    base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    tag: LinkTag,
    tag_prefix_index: PrefixIndex,
    link_name: &str,
) -> ExternResult<ValidateCallbackResult> {
    // Target should be a Mew
    let Ok(action_hash) = ActionHash::try_from(target_address) else {
        return Ok(ValidateCallbackResult::Invalid(format!(
            "{link_name} target address must be an action hash"
        )));
    };
    let record = must_get_valid_record(action_hash)?;
    let maybe_mew = match record.entry().to_app_option::<crate::Mew>() {
        Ok(maybe_mew) => maybe_mew,
        Err(_) => {
            return Ok(ValidateCallbackResult::Invalid(format!(
                "{link_name} target must reference a mew"
            )));
        }
    };
    if maybe_mew.is_none() {
        return Ok(ValidateCallbackResult::Invalid(format!(
            "{link_name} target action must reference an entry"
        )));
    }

    // Tag should be a utf8 string
    let Ok(tag_string) = String::from_utf8(tag.into_inner()) else {
        return Ok(ValidateCallbackResult::Invalid(format!(
            "{link_name} tag must be a utf8 string"
        )));
    };

    // Base address should be prefix index path matching tag prefix
    let prefix_path_hash = tag_prefix_index
        .make_result_path(tag_string, None)?
        .path_entry_hash()?;
    let Ok(base_address_entry_hash) = EntryHash::try_from(base_address) else {
        return Ok(ValidateCallbackResult::Invalid(format!(
            "{link_name} base address must be an entry hash"
        )));
    };

    if base_address_entry_hash != prefix_path_hash {
        return Ok(ValidateCallbackResult::Invalid(format!(
            "{link_name} base address should be '{prefix_path_hash:?}'"
        )));
    }

    Ok(ValidateCallbackResult::Valid)
}
