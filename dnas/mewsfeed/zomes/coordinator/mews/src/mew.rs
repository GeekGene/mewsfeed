use crate::cashtag_to_mews::*;
use crate::hashtag_to_mews::*;
use crate::mention_to_mews::*;
use crate::mew_to_responses::*;
use crate::mew_with_context::get_mew_with_context;
use hdk::prelude::*;
use mews_integrity::*;
use regex::Regex;

#[hdk_extern]
pub fn create_mew(mew: Mew) -> ExternResult<ActionHash> {
    let mew_hash = create_entry(EntryTypes::Mew(mew.clone()))?;
    let path = Path::from("all_mews");
    create_link(
        path.path_entry_hash()?,
        mew_hash.clone(),
        LinkTypes::AllMews,
        (),
    )?;
    let my_agent_pub_key = agent_info()?.agent_latest_pubkey;
    create_link(my_agent_pub_key, mew_hash.clone(), LinkTypes::AgentMews, ())?;
    add_tags_for_mew(mew.clone(), mew_hash.clone())?;

    match mew.mew_type {
        MewType::Quote(base_original_mew_hash) => {
            add_response_for_mew(AddResponseForMewInput {
                base_original_mew_hash,
                target_response_mew_hash: mew_hash.clone(),
                response_type: ResponseType::Quote,
            })?;
        }
        MewType::Reply(base_original_mew_hash) => {
            add_response_for_mew(AddResponseForMewInput {
                base_original_mew_hash,
                target_response_mew_hash: mew_hash.clone(),
                response_type: ResponseType::Reply,
            })?;
        }
        MewType::Mewmew(base_original_mew_hash) => {
            add_response_for_mew(AddResponseForMewInput {
                base_original_mew_hash,
                target_response_mew_hash: mew_hash.clone(),
                response_type: ResponseType::Mewmew,
            })?;
        }
        _ => {}
    }

    Ok(mew_hash)
}

#[hdk_extern]
pub fn create_mew_with_context(mew: Mew) -> ExternResult<FeedMew> {
    let action_hash = create_mew(mew)?;
    get_mew_with_context(action_hash)
}

#[hdk_extern]
pub fn get_mew(original_mew_hash: ActionHash) -> ExternResult<Option<Record>> {
    get(original_mew_hash, GetOptions::default())
}

#[hdk_extern]
pub fn delete_mew(original_mew_hash: ActionHash) -> ExternResult<ActionHash> {
    let maybe_record = get(original_mew_hash.clone(), GetOptions::default())?;
    if let Some(record) = maybe_record {
        let mew = record
            .entry()
            .to_app_option()
            .map_err(|e| wasm_error!(e))?
            .ok_or(wasm_error!(WasmErrorInner::Guest(String::from(
                "Linked action must reference an entry"
            ))))?;
        remove_tags_for_mew(mew, original_mew_hash.clone())?;
    }

    let path_hash = Path::from("all_mews").path_entry_hash()?;
    let links = get_links(
        GetLinksInputBuilder::try_new(path_hash, LinkTypes::AllMews.try_into_filter()?)?.build(),
    )?;
    for link in links {
        let action_hash =
            ActionHash::try_from(link.target.clone()).map_err(|err| wasm_error!(err))?;
        if action_hash.eq(&original_mew_hash) {
            delete_link(link.create_link_hash)?;
        }
    }

    let my_agent_pub_key = agent_info()?.agent_latest_pubkey;
    let links = get_links(
        GetLinksInputBuilder::try_new(my_agent_pub_key, LinkTypes::AgentMews.try_into_filter()?)?
            .build(),
    )?;
    for link in links {
        let action_hash =
            ActionHash::try_from(link.target.clone()).map_err(|err| wasm_error!(err))?;
        if action_hash.eq(&original_mew_hash) {
            delete_link(link.create_link_hash)?;
        }
    }

    let links = get_links(
        GetLinksInputBuilder::try_new(
            original_mew_hash.clone(),
            LinkTypes::MewToResponses.try_into_filter()?,
        )?
        .build(),
    )?;
    for link in links {
        let action_hash =
            ActionHash::try_from(link.target.clone()).map_err(|err| wasm_error!(err))?;
        if action_hash.eq(&original_mew_hash) {
            delete_link(link.create_link_hash)?;
        }
    }

    delete_entry(original_mew_hash)
}

fn add_tags_for_mew(mew: Mew, mew_hash: ActionHash) -> ExternResult<()> {
    let (hashtag_regex, cashtag_regex) = tag_regexes()?;
    for regex_match in hashtag_regex.find_iter(&mew.text) {
        add_hashtag_for_mew(AddHashtagForMewInput {
            base_hashtag: regex_match.as_str().into(),
            target_mew_hash: mew_hash.clone(),
        })?;
    }
    for regex_match in cashtag_regex.find_iter(&mew.text) {
        add_cashtag_for_mew(AddCashtagForMewInput {
            base_cashtag: regex_match.as_str().into(),
            target_mew_hash: mew_hash.clone(),
        })?;
    }
    for link in mew.links {
        if let LinkTarget::Mention(mention) = link {
            add_mention_for_mew(AddMentionForMewInput {
                base_mention: mention,
                target_mew_hash: mew_hash.clone(),
            })?;
        }
    }

    Ok(())
}

fn remove_tags_for_mew(mew: Mew, mew_hash: ActionHash) -> ExternResult<()> {
    let (hashtag_regex, cashtag_regex) = tag_regexes()?;
    for regex_match in hashtag_regex.find_iter(&mew.text) {
        remove_hashtag_for_mew(RemoveHashtagForMewInput {
            base_hashtag: regex_match.as_str().into(),
            target_mew_hash: mew_hash.clone(),
        })?;
    }
    for regex_match in cashtag_regex.find_iter(&mew.text) {
        remove_cashtag_for_mew(RemoveCashtagForMewInput {
            base_cashtag: regex_match.as_str().into(),
            target_mew_hash: mew_hash.clone(),
        })?;
    }
    for link in mew.links {
        if let LinkTarget::Mention(base_mention) = link {
            remove_mention_for_mew(RemoveMentionForMewInput {
                base_mention,
                target_mew_hash: mew_hash.clone(),
            })?;
        }
    }

    Ok(())
}

fn tag_regexes() -> ExternResult<(Regex, Regex)> {
    let hashtag_regex = Regex::new(r"#\w+").map_err(|_| {
        wasm_error!(WasmErrorInner::Guest(
            "Failed to create hashtag regex".into()
        ))
    })?;
    let cashtag_regex = Regex::new(r"\$\w+").map_err(|_| {
        wasm_error!(WasmErrorInner::Guest(
            "Failed to create cashtag regex".into()
        ))
    })?;

    Ok((hashtag_regex, cashtag_regex))
}
