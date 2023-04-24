use hdk::prelude::*;
use regex::Regex;
use mews_integrity::*;
use crate::mew_to_responses::*;
use crate::mention_to_mews::*;
use crate::cashtag_to_mews::*;
use crate::hashtag_to_mews::*;
use crate::liker_to_mews::*;

#[hdk_extern]
pub fn create_mew(mew: Mew) -> ExternResult<Record> {
    let mew_hash = create_entry(EntryTypes::Mew(mew.clone()))?;
    let record = get(mew_hash.clone(), GetOptions::default())?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Could not find the newly created Mew"))
            ),
        )?;
    let path = Path::from("all_mews");
    create_link(path.path_entry_hash()?, mew_hash.clone(), LinkTypes::AllMews, ())?;
    let my_agent_pub_key = agent_info()?.agent_latest_pubkey;
    create_link(my_agent_pub_key, mew_hash.clone(), LinkTypes::AgentMews, ())?;
    add_tags_for_mew(mew.clone(), mew_hash.clone())?;
    
    match mew.mew_type {
        MewType::Quote(original_mew_hash) => {
            add_response_for_mew(AddResponseForMewInput { original_mew_hash, response_mew_hash: mew_hash, response_type: ResponseType::Quote })?;
        }
        MewType::Reply(original_mew_hash) => {
            add_response_for_mew(AddResponseForMewInput { original_mew_hash, response_mew_hash: mew_hash, response_type: ResponseType::Reply })?;
        }
        MewType::Mewmew(original_mew_hash) => {
            add_response_for_mew(AddResponseForMewInput { original_mew_hash, response_mew_hash: mew_hash, response_type: ResponseType::Mewmew })?;
        }
        _ => { }
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
    let mew: Mew =
        element
            .entry()
            .to_app_option()
            .unwrap()
            .ok_or(wasm_error!(WasmErrorInner::Guest(String::from(
                "Malformed mew"
            ))))?;

    let licks: Vec<HoloHash<holo_hash::hash_type::Agent>> = get_likers_for_mew(original_mew_hash.clone())?;
    let replies: Vec<HoloHash<holo_hash::hash_type::Action>> = get_response_hashes_for_mew(GetResponsesForMewInput { original_mew_hash: original_mew_hash.clone(), response_type: Some(ResponseType::Reply)})?;
    let quotes = get_response_hashes_for_mew(GetResponsesForMewInput { original_mew_hash: original_mew_hash.clone(), response_type: Some(ResponseType::Quote)})?;
    let mewmews = get_response_hashes_for_mew(GetResponsesForMewInput { original_mew_hash: original_mew_hash.clone(), response_type: Some(ResponseType::Mewmew)})?;

    let feed_mew_and_context = FeedMew {
        mew,
        action: element.action().clone(),
        action_hash: element.signed_action().as_hash().clone(),
        replies,
        quotes,
        licks,
        mewmews,
    };
    Ok(feed_mew_and_context)
}


#[hdk_extern]
pub fn delete_mew(original_mew_hash: ActionHash) -> ExternResult<ActionHash> {
    let maybe_record = get(original_mew_hash.clone(), GetOptions::default())?;
    if let Some(record) = maybe_record {
        let mew = record.entry().to_app_option()
            .map_err(|e| wasm_error!(e))?
            .ok_or(
                wasm_error!(
                    WasmErrorInner::Guest(String::from("Linked action must reference an entry"))
                ),
            )?;
        remove_tags_for_mew(mew, original_mew_hash.clone())?;
    }

    let path_hash = Path::from("all_mews").path_entry_hash()?;
    let links = get_links(path_hash.clone(), LinkTypes::AllMews, None)?;
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
    let hashtag_regex = Regex::new(r"#\w+").unwrap();
    let cashtag_regex = Regex::new(r"\$\w+").unwrap();
    for regex_match in hashtag_regex.find_iter(&mew.text) {
        add_hashtag_for_mew(AddHashtagForMewInput { mew_hash: mew_hash.clone(), hashtag: regex_match.as_str().into() })?;
    }
    for regex_match in cashtag_regex.find_iter(&mew.text) {
        add_cashtag_for_mew(AddCashtagForMewInput { mew_hash: mew_hash.clone(), cashtag: regex_match.as_str().into() })?;
    }
    for link in mew.links {
        if let LinkTarget::Mention(mention) = link {
            add_mention_for_mew(AddMentionForMewInput { mew_hash: mew_hash.clone(), mention })?;
        }
    }
    
    Ok(())
}

fn remove_tags_for_mew(mew: Mew, mew_hash: ActionHash) -> ExternResult<()> {
    let hashtag_regex = Regex::new(r"#\w+").unwrap();
    let cashtag_regex = Regex::new(r"\$\w+").unwrap();
    for regex_match in hashtag_regex.find_iter(&mew.text) {
        remove_hashtag_for_mew(RemoveHashtagForMewInput { mew_hash: mew_hash.clone(), hashtag: regex_match.as_str().into() })?;
    }
    for regex_match in cashtag_regex.find_iter(&mew.text) {
        remove_cashtag_for_mew(RemoveCashtagForMewInput { mew_hash: mew_hash.clone(), cashtag: regex_match.as_str().into() })?;
    }
    for link in mew.links {
        if let LinkTarget::Mention(mention) = link {
            remove_mention_for_mew(RemoveMentionForMewInput { mew_hash: mew_hash.clone(), mention })?;
        }
    }
    
    Ok(())
}
