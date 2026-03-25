use hdk::prelude::*;
use mews_integrity::LinkTypes;

pub fn get_all_mew_hashes(strategy: GetStrategy) -> ExternResult<Vec<ActionHash>> {
    let path = Path::from("all_mews");
    let path_hash = match path.path_entry_hash() {
        Ok(h) => h,
        Err(e) => {
            debug!("Skipping all_mews path hash error: {:?}", e);
            return Ok(vec![]);
        }
    };
    let filter = match LinkTypes::AllMews.try_into_filter() {
        Ok(f) => f,
        Err(e) => {
            debug!("Skipping all_mews filter error: {:?}", e);
            return Ok(vec![]);
        }
    };
    let mut links = match get_links(LinkQuery::new(path_hash, filter), strategy) {
        Ok(l) => l,
        Err(e) => {
            debug!("Skipping all_mews get_links error: {:?}", e);
            return Ok(vec![]);
        }
    };
    links.sort_by_key(|a| a.timestamp);
    let hashes: Vec<ActionHash> = links
        .into_iter()
        .filter_map(|link| ActionHash::try_from(link.target).ok())
        .collect();

    Ok(hashes)
}
