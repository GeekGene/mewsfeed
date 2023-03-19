use crate::cashtag_to_mews::*;
use crate::hashtag_to_mews::*;
use crate::licker_to_mews::*;
use crate::mention_to_mews::*;
use crate::mew_to_responses::*;
use hdk::prelude::*;
use mews_integrity::*;
use regex::Regex;

#[hdk_extern]
pub fn create_mew(mew: Mew) -> ExternResult<Record> {
    let mew_hash = create_entry(EntryTypes::Mew(mew.clone()))?;
    let record = get(mew_hash.clone(), GetOptions::default())?.ok_or(wasm_error!(
        WasmErrorInner::Guest(String::from("Could not find the newly created Mew"))
    ))?;
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
                target_response_mew_hash: mew_hash,
                response_type: ResponseType::Quote,
            })?;
        }
        MewType::Reply(base_original_mew_hash) => {
            add_response_for_mew(AddResponseForMewInput {
                base_original_mew_hash,
                target_response_mew_hash: mew_hash,
                response_type: ResponseType::Reply,
            })?;
        }
        MewType::Mewmew(base_original_mew_hash) => {
            add_response_for_mew(AddResponseForMewInput {
                base_original_mew_hash,
                target_response_mew_hash: mew_hash,
                response_type: ResponseType::Mewmew,
            })?;
        }
        _ => {}
    }
    Ok(record)
}

#[hdk_extern]
pub fn get_mew(original_mew_hash: ActionHash) -> ExternResult<Option<Record>> {
    get(original_mew_hash, GetOptions::default())
}

#[hdk_extern]
pub fn get_mew_with_context(original_mew_hash: ActionHash) -> ExternResult<FeedMew> {
    let element = get(original_mew_hash.clone(), GetOptions::default())?.ok_or(wasm_error!(
        WasmErrorInner::Guest(String::from("Mew not found"))
    ))?;
    let mew: Mew = element
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(WasmErrorInner::Guest(e.into())))?
        .ok_or(wasm_error!(WasmErrorInner::Guest(String::from(
            "Malformed mew"
        ))))?;

    let replies = get_response_hashes_for_mew(GetResponsesForMewInput {
        original_mew_hash: original_mew_hash.clone(),
        response_type: Some(ResponseType::Reply),
    })?;
    let quotes = get_response_hashes_for_mew(GetResponsesForMewInput {
        original_mew_hash: original_mew_hash.clone(),
        response_type: Some(ResponseType::Quote),
    })?;
    let mewmews = get_response_hashes_for_mew(GetResponsesForMewInput {
        original_mew_hash: original_mew_hash.clone(),
        response_type: Some(ResponseType::Mewmew),
    })?;
    let licks = get_lickers_for_mew(original_mew_hash)?;

    let feed_mew_and_context = FeedMew {
        mew,
        action: element.action().clone(),
        action_hash: element.signed_action().as_hash().clone(),
        replies,
        quotes,
        licks,
        mewmews,
        weight: None, // TODO is this correct?
        topic: None,  // TODO is this correct?
    };
    Ok(feed_mew_and_context)
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
    let links = get_links(path_hash, LinkTypes::AllMews, None)?;
    for link in links {
        if ActionHash::from(link.target.clone()).eq(&original_mew_hash) {
            delete_link(link.create_link_hash)?;
        }
    }

    let my_agent_pub_key = agent_info()?.agent_latest_pubkey;
    let links = get_links(my_agent_pub_key, LinkTypes::AgentMews, None)?;
    for link in links {
        if ActionHash::from(link.target.clone()).eq(&original_mew_hash) {
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
