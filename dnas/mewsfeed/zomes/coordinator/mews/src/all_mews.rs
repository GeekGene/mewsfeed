use hdk::prelude::*;
use mews_integrity::LinkTypes;

pub fn get_all_mew_hashes(strategy: GetStrategy) -> ExternResult<Vec<ActionHash>> {
    let path = Path::from("all_mews");
    let mut links = get_links(
        LinkQuery::new(
            path.path_entry_hash()?,
            LinkTypes::AllMews.try_into_filter()?,
        ),
        strategy,
    )?;
    links.sort_by_key(|a| a.timestamp);
    let hashes: Vec<ActionHash> = links
        .into_iter()
        .filter_map(|link| ActionHash::try_from(link.target).ok())
        .collect();

    Ok(hashes)
}
