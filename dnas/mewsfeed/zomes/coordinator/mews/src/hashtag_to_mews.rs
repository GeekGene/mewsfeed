use crate::mew::get_mew_with_context;
use hdk::prelude::*;
use mews_integrity::*;
use prefix_index::*;

#[derive(Serialize, Deserialize, Debug)]
pub struct AddHashtagForMewInput {
    pub base_hashtag: String,
    pub target_mew_hash: ActionHash,
}

#[hdk_extern]
pub fn add_hashtag_for_mew(input: AddHashtagForMewInput) -> ExternResult<()> {
    // Link from hashtag to mew
    create_link(
        Path::from(input.base_hashtag.clone()).path_entry_hash()?,
        input.target_mew_hash.clone(),
        LinkTypes::HashtagToMews,
        input.base_hashtag.as_bytes().to_vec(),
    )?;

    // Add hashtag to prefix index, link to mew_hash
    let tag: &str = input.base_hashtag.split('#').nth(1).unwrap_or_else(|| &input.base_hashtag);
    add_hash_for_prefix_index(
        TAG_PREFIX_INDEX_NAME,
        LinkTypes::PrefixIndex,
        tag,
        input.target_mew_hash,
        LinkTypes::PrefixIndexToHashtags,
    )?;

    Ok(())
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RemoveHashtagForMewInput {
    pub base_hashtag: String,
    pub target_mew_hash: ActionHash,
}
#[hdk_extern]
pub fn remove_hashtag_for_mew(input: RemoveHashtagForMewInput) -> ExternResult<()> {
    let links = get_links(
        Path::from(input.base_hashtag.clone()).path_entry_hash()?,
        LinkTypes::HashtagToMews,
        Some(LinkTag(input.base_hashtag.as_bytes().to_vec())),
    )?;
    for link in links {
        if ActionHash::from(link.target.clone()).eq(&input.target_mew_hash) {
            delete_link(link.create_link_hash)?;
        }
    }

    remove_hash_for_prefix_index(
        TAG_PREFIX_INDEX_NAME,
        input.base_hashtag,
        AnyLinkableHash::from(input.target_mew_hash),
    )?;

    Ok(())
}

#[hdk_extern]
pub fn get_mews_for_hashtag(hashtag: String) -> ExternResult<Vec<Record>> {
    let hashes = get_hashes_for_prefix(
        TAG_PREFIX_INDEX_NAME,
        hashtag,
        LinkTypes::PrefixIndexToHashtags,
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
pub fn get_mews_for_hashtag_with_context(hashtag: String) -> ExternResult<Vec<FeedMew>> {
    let hashes = get_hashes_for_prefix(
        TAG_PREFIX_INDEX_NAME,
        hashtag,
        LinkTypes::PrefixIndexToHashtags,
    )?;

    let feedmews: Vec<FeedMew> = hashes
        .into_iter()
        .filter_map(|hash| get_mew_with_context(ActionHash::from(hash)).ok())
        .collect();

    Ok(feedmews)
}

#[hdk_extern]
fn search_hashtags(query: String) -> ExternResult<Vec<String>> {
    let tags = get_tags_for_prefix(
        TAG_PREFIX_INDEX_NAME,
        query,
        LinkTypes::PrefixIndexToHashtags,
    )?;

    Ok(tags)
}
