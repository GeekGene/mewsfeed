use hdk::prelude::*;
use mews_integrity::LinkTypes;

pub fn get_all_mew_hashes() -> ExternResult<Vec<ActionHash>> {
    let path = Path::from("all_mews");
    let mut links = get_links(GetLinksInput {
        base_address: path.path_entry_hash()?.into(),
        link_type: LinkTypes::AllMews.try_into_filter()?,
        tag_prefix: None,
        after: None,
        before: None,
        author: None,
    })?;
    links.sort_by_key(|a| a.timestamp);
    let hashes: Vec<ActionHash> = links
        .into_iter()
        .filter_map(|link| ActionHash::try_from(link.target).ok())
        .collect();

    Ok(hashes)
}
