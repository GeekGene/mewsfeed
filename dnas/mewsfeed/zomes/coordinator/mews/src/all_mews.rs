use hdk::prelude::*;
use mews_integrity::*;

pub fn get_all_mew_hashes() -> ExternResult<Vec<ActionHash>> {
    let path = Path::from("all_mews");
    let mut links = get_links(path.path_entry_hash()?, LinkTypes::AllMews, None)?;
    links.sort_by_key(|a| a.timestamp);
    let hashes: Vec<ActionHash> = links
        .into_iter()
        .filter_map(|link| ActionHash::try_from(link.target).ok())
        .collect();

    Ok(hashes)
}
