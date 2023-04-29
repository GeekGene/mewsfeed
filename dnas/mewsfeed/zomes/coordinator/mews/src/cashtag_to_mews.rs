use crate::mew::get_mew_with_context;
use hdk::prelude::*;
use mews_integrity::*;
use prefix_index::*;

#[derive(Serialize, Deserialize, Debug)]
pub struct AddCashtagForMewInput {
    pub base_cashtag: String,
    pub target_mew_hash: ActionHash,
}

#[hdk_extern]
pub fn add_cashtag_for_mew(input: AddCashtagForMewInput) -> ExternResult<()> {
    // Link from cashtag to mew
    create_link(
        Path::from(input.base_cashtag.clone()).path_entry_hash()?,
        input.target_mew_hash.clone(),
        LinkTypes::CashtagToMews,
        input.base_cashtag.as_bytes().to_vec(),
    )?;

    // Add cashtag to prefix index, link to mew_hash
    let tag: &str = input.base_cashtag.split('$').nth(1).unwrap_or_else(|| &input.base_cashtag);
    add_hash_for_prefix_index(
        TAG_PREFIX_INDEX_NAME,
        LinkTypes::PrefixIndex,
        tag,
        input.target_mew_hash,
        LinkTypes::PrefixIndexToCashtags,
    )?;

    Ok(())
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RemoveCashtagForMewInput {
    pub base_cashtag: String,
    pub target_mew_hash: ActionHash,
}
#[hdk_extern]
pub fn remove_cashtag_for_mew(input: RemoveCashtagForMewInput) -> ExternResult<()> {
    let links = get_links(
        Path::from(input.base_cashtag.clone()).path_entry_hash()?,
        LinkTypes::CashtagToMews,
        Some(LinkTag(input.base_cashtag.as_bytes().to_vec())),
    )?;
    for link in links {
        if ActionHash::from(link.target.clone()).eq(&input.target_mew_hash) {
            delete_link(link.create_link_hash)?;
        }
    }

    remove_hash_for_prefix_index(
        TAG_PREFIX_INDEX_NAME,
        input.base_cashtag,
        AnyLinkableHash::from(input.target_mew_hash),
    )?;

    Ok(())
}

#[hdk_extern]
pub fn get_mews_for_cashtag(cashtag: String) -> ExternResult<Vec<Record>> {
    let hashes = get_hashes_for_prefix(
        TAG_PREFIX_INDEX_NAME,
        cashtag,
        LinkTypes::PrefixIndexToCashtags,
    )?;
    let get_input: Vec<GetInput> = hashes
        .into_iter()
        .map(|hash| GetInput::new(ActionHash::from(hash).into(), GetOptions::default()))
        .collect();

    // Get the records to filter out the deleted ones
    let records: Vec<Record> = HDK
        .with(|hdk| hdk.borrow().get(get_input))?
        .into_iter()
        .flatten()
        .collect();

    Ok(records)
}

#[hdk_extern]
pub fn get_mews_for_cashtag_with_context(cashtag: String) -> ExternResult<Vec<FeedMew>> {
    let hashes = get_hashes_for_prefix(
        TAG_PREFIX_INDEX_NAME,
        cashtag,
        LinkTypes::PrefixIndexToCashtags,
    )?;

    let feedmews: Vec<FeedMew> = hashes
        .into_iter()
        .filter_map(|hash| get_mew_with_context(ActionHash::from(hash)).ok())
        .collect();

    Ok(feedmews)
}

#[hdk_extern]
fn search_cashtags(query: String) -> ExternResult<Vec<String>> {
    let tags = get_tags_for_prefix(
        TAG_PREFIX_INDEX_NAME,
        query,
        LinkTypes::PrefixIndexToCashtags,
    )?;

    Ok(tags)
}
