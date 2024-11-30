use crate::{mew_with_context::get_mew_with_context, tag_to_mews::*};
use hc_link_pagination::HashPagination;
use hdk::prelude::*;
use mews_integrity::*;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AddHashtagForMewInput {
    pub base_hashtag: String,
    pub target_mew_hash: ActionHash,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct GetMewsForHashtagWithContextInput {
    hashtag: String,
    page: Option<HashPagination>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RemoveHashtagForMewInput {
    pub base_hashtag: String,
    pub target_mew_hash: ActionHash,
}

#[hdk_extern]
pub fn add_hashtag_for_mew(input: AddHashtagForMewInput) -> ExternResult<()> {
    // Add hashtag to prefix index
    let tag_text = make_tag_text(input.base_hashtag.clone());
    let prefix_index = make_tag_prefix_index()?;
    let path = prefix_index.add_result_with_label(tag_text, input.base_hashtag.clone())?;

    // Link from hashtag to mew_hash
    create_link(
        path.path_entry_hash()?,
        input.target_mew_hash.clone(),
        LinkTypes::HashtagToMews,
        LinkTag(input.base_hashtag.as_bytes().to_vec()),
    )?;

    add_hashtag_by_author_for_mew(input)?;

    Ok(())
}

pub fn add_hashtag_by_author_for_mew(input: AddHashtagForMewInput) -> ExternResult<()> {
    let tag_text = make_hashtag_text(input.base_hashtag.clone());
    let prefix_index = make_tag_prefix_index()?;

    let me = agent_info()?.agent_latest_pubkey;
    let path_text = format!("{}.{}", tag_text, me);
    // debug!("path_text on create --- {}", path_text);

    let path = prefix_index.add_result(path_text)?;

    // Link from hashtag to mew_hash
    create_link(
        path.path_entry_hash()?,
        input.target_mew_hash,
        LinkTypes::HashtagByAuthorToMews,
        LinkTag(input.base_hashtag.as_bytes().to_vec()),
    )?;

    Ok(())
}

#[hdk_extern]
pub fn get_mews_for_hashtag_with_context(
    input: GetMewsForHashtagWithContextInput,
) -> ExternResult<Vec<FeedMew>> {
    // Get links from hashtag to mew
    let tag = make_hashtag_text(input.hashtag.clone());
    let prefix_index = make_tag_prefix_index()?;
    let result_path: Path = prefix_index.make_result_path(tag, Some(input.hashtag))?;

    let links = get_links(
        GetLinksInputBuilder::try_new(
            result_path.path_entry_hash()?,
            LinkTypes::HashtagByAuthorToMews.try_into_filter()?,
        )?
        .build(),
    )?;

    // Get mews with context
    let feedmews: Vec<FeedMew> = links
        .into_iter()
        .filter_map(|l| l.target.into_action_hash())
        .filter_map(|ah| get_mew_with_context(ah).ok())
        .collect();

    Ok(feedmews)
}

pub fn get_mews_for_hashtag_by_author_with_context(
    hashtag: String,
    agent: AgentPubKey,
) -> ExternResult<Vec<FeedMew>> {
    // Get links from hashtag to mew
    let tag = make_hashtag_text(hashtag.clone());
    let prefix_index = make_tag_prefix_index()?;

    let path_text = format!("{}.{}", tag, agent);
    // debug!("path_text --- {}", path_text);

    let result_path: Path = prefix_index.make_result_path(path_text, None)?;

    let links = get_links(
        GetLinksInputBuilder::try_new(
            result_path.path_entry_hash()?,
            LinkTypes::HashtagByAuthorToMews.try_into_filter()?,
        )?
        .build(),
    )?;

    // Get mews with context
    let feedmews: Vec<FeedMew> = links
        .into_iter()
        .filter_map(|l| l.target.into_action_hash())
        .filter_map(|ah| get_mew_with_context(ah).ok())
        .collect();
    Ok(feedmews)
}

fn make_hashtag_text(text: String) -> String {
    text.split('#').nth(1).unwrap_or(&text).to_string()
}

#[hdk_extern]
pub fn remove_hashtag_for_mew(input: RemoveHashtagForMewInput) -> ExternResult<()> {
    let tag = make_tag_text(input.base_hashtag.clone());
    let prefix_index = make_tag_prefix_index()?;
    let result_path = prefix_index.make_result_path(tag, Some(input.base_hashtag.clone()))?;
    let links = get_links(
        GetLinksInputBuilder::try_new(
            result_path.path_entry_hash()?,
            LinkTypes::HashtagToMews.try_into_filter()?,
        )?
        .build(),
    )?;
    for link in links {
        let action_hash =
            ActionHash::try_from(link.target.clone()).map_err(|err| wasm_error!(err))?;
        if action_hash.eq(&input.target_mew_hash) {
            delete_link(link.create_link_hash)?;
        }
    }

    Ok(())
}
