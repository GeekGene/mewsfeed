use crate::tag_to_mews::*;
use hc_link_pagination::HashPagination;
use hdk::prelude::*;
use mews_integrity::*;

#[derive(Serialize, Deserialize, Debug)]
pub struct AddHashtagForMewInput {
    pub base_hashtag: String,
    pub target_mew_hash: ActionHash,
}
#[hdk_extern]
pub fn add_hashtag_for_mew(input: AddHashtagForMewInput) -> ExternResult<()> {
    // Add cashtag to prefix index
    let tag_text = make_tag_text(input.base_hashtag.clone());
    let prefix_index = make_tag_prefix_index()?;
    let path = prefix_index.add_result_with_label(tag_text, input.base_hashtag.clone())?;

    // Link from hashtag to mew_hash
    create_link(
        path.path_entry_hash()?,
        input.target_mew_hash,
        LinkTypes::HashtagToMews,
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
    let tag = make_tag_text(input.base_hashtag.clone());
    let prefix_index = make_tag_prefix_index()?;
    let result_path = prefix_index.make_result_path(tag, Some(input.base_hashtag.clone()))?;
    let links = get_links(GetLinksInput {
        base_address: result_path.path_entry_hash()?.into(),
        link_type: LinkTypes::HashtagToMews.try_into_filter()?,
        tag_prefix: Some(LinkTag(input.base_hashtag.as_bytes().to_vec())),
        after: None,
        before: None,
        author: None,
        get_options: GetOptions::default(),
    })?;
    for link in links {
        let action_hash =
            ActionHash::try_from(link.target.clone()).map_err(|err| wasm_error!(err))?;
        if action_hash.eq(&input.target_mew_hash) {
            delete_link(link.create_link_hash)?;
        }
    }

    Ok(())
}

#[derive(Serialize, Deserialize, Debug)]
pub struct GetMewsForHashtagWithContextInput {
    hashtag: String,
    page: Option<HashPagination>,
}
#[hdk_extern]
pub fn get_mews_for_hashtag_with_context(
    input: GetMewsForHashtagWithContextInput,
) -> ExternResult<Vec<FeedMew>> {
    get_mews_for_tag_with_context(input.hashtag, LinkTypes::HashtagToMews, input.page)
}
