use hdk::prelude::*;
use mews_integrity::*;

pub fn get_all_mew_hashes() -> ExternResult<Vec<ActionHash>> {
    let path = Path::from("all_mews");
    let mut links = get_links(path.path_entry_hash()?, LinkTypes::AllMews, None)?;
    links.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
    let hashes: Vec<ActionHash> = links
        .into_iter()
        .map(|link| ActionHash::from(link.target))
        .collect();

    Ok(hashes)
}
