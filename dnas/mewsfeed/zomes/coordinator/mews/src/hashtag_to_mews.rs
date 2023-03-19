use crate::mew::get_mew_with_context;
use hdk::prelude::*;
use mews_integrity::*;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AddHashtagForMewInput {
    pub base_hashtag: String,
    pub target_mew_hash: ActionHash,
}
#[hdk_extern]
pub fn add_hashtag_for_mew(input: AddHashtagForMewInput) -> ExternResult<()> {
    // Add hashtag to prefix index
    let tag_text = make_hashtag_text(input.base_hashtag.clone());
    let prefix_index = make_tag_prefix_index()?;
    let path = prefix_index.add_result_with_label(tag_text, input.base_hashtag.clone())?;

    // Link from hashtag to mew_hash
    create_link(
        path.path_entry_hash()?,
        input.clone().target_mew_hash,
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
    debug!("path_text on create --- {}", path_text);

    let path = prefix_index.add_result_with_label(path_text, input.base_hashtag.clone())?; // TODO what should full_text be?

    // Link from hashtag to mew_hash
    create_link(
        path.path_entry_hash()?,
        input.target_mew_hash,
        LinkTypes::HashtagByAuthorToMews,
        LinkTag(input.base_hashtag.as_bytes().to_vec()),
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
    let tag = make_hashtag_text(input.base_hashtag.clone());
    let prefix_index = make_tag_prefix_index()?;
    let result_path = prefix_index.make_result_path(tag, Some(input.base_hashtag.clone()))?;

    let links = get_links(
        result_path.path_entry_hash()?,
        LinkTypes::HashtagToMews,
        Some(LinkTag(input.base_hashtag.as_bytes().to_vec())),
    )?;
    for link in links {
        if ActionHash::from(link.target.clone()).eq(&input.target_mew_hash) {
            delete_link(link.create_link_hash)?;
        }
    }

    Ok(())
}

#[hdk_extern]
pub fn get_mews_for_hashtag(hashtag: String) -> ExternResult<Vec<Record>> {
    // Get links from hashtag to mew
    let tag = make_hashtag_text(hashtag.clone());
    let prefix_index = make_tag_prefix_index()?;
    let result_path: Path = prefix_index.make_result_path(tag, Some(hashtag))?;

    let links = get_links(
        result_path.path_entry_hash()?,
        LinkTypes::HashtagToMews,
        None,
    )?;
    let get_input: Vec<GetInput> = links
        .into_iter()
        .map(|l| GetInput::new(ActionHash::from(l.target).into(), GetOptions::default()))
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
    // Get links from hashtag to mew
    let tag = make_hashtag_text(hashtag.clone());
    let prefix_index = make_tag_prefix_index()?;
    let result_path: Path = prefix_index.make_result_path(tag, Some(hashtag))?;

    let links = get_links(
        result_path.path_entry_hash()?,
        LinkTypes::HashtagToMews,
        None,
    )?;

    // Get mews with context
    let feedmews: Vec<FeedMew> = links
        .into_iter()
        .filter_map(|l| get_mew_with_context(ActionHash::from(l.target)).ok())
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
    debug!("path_text --- {}", path_text);

    let result_path: Path = prefix_index.make_result_path(path_text, Some(hashtag))?;

    let links = get_links(
        result_path.path_entry_hash()?,
        LinkTypes::HashtagByAuthorToMews,
        None,
    )?;

    // Get mews with context
    let feedmews: Vec<FeedMew> = links
        .into_iter()
        .filter_map(|l| get_mew_with_context(ActionHash::from(l.target)).ok())
        .collect();

    Ok(feedmews)
}

fn make_hashtag_text(text: String) -> String {
    text.split('#').nth(1).unwrap_or(&text).to_string()
}
