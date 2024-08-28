use crate::mew_with_context::get_mew_with_context;
use hc_link_pagination::{paginate_by_hash, HashPagination};
use hdk::prelude::*;
use mews_integrity::*;

pub fn get_mew_hashes_for_tag(
    tag: String,
    link_type: impl LinkTypeFilterExt,
    page: Option<HashPagination>,
) -> ExternResult<Vec<ActionHash>> {
    let tag_text = make_tag_text(tag.clone());
    let prefix_index = make_tag_prefix_index()?;
    let result_path: Path = prefix_index.make_result_path(tag_text, Some(tag))?;

    let links = get_links(
        GetLinksInputBuilder::try_new(
            result_path.path_entry_hash()?,
            link_type.try_into_filter()?,
        )?
        .build(),
    )?;
    let links_page = paginate_by_hash(links, page)?;
    let hashes: Vec<ActionHash> = links_page
        .iter()
        .filter_map(|l| ActionHash::try_from(l.target.clone()).ok())
        .collect();

    Ok(hashes)
}

pub fn get_mews_for_tag_with_context(
    tag: String,
    link_type: impl LinkTypeFilterExt,
    page: Option<HashPagination>,
) -> ExternResult<Vec<FeedMew>> {
    let hashes = get_mew_hashes_for_tag(tag, link_type, page)?;

    // Get mews with context
    let feedmews: Vec<FeedMew> = hashes
        .iter()
        .filter_map(|h| get_mew_with_context(h.clone()).ok())
        .collect();

    Ok(feedmews)
}

pub fn make_tag_text(mut text: String) -> String {
    text.remove(0);

    text
}
