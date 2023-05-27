use hdk::prelude::*;

#[derive(Serialize, Deserialize, SerializedBytes, Debug, Clone)]
pub struct HashPagination {
    pub after_hash: Option<AnyLinkableHash>,
    pub limit: usize,
}

pub fn get_by_hash_pagination(
    links: Vec<Link>,
    page: Option<HashPagination>,
) -> ExternResult<Vec<Link>> {
    let mut links_copy = links.clone();
    links_copy.sort_by_key(|l| l.timestamp);

    match page {
        Some(HashPagination { after_hash, limit }) => {
            
            let start_index = match after_hash {
                Some(hash) => {
                    match links_copy.iter().position(|l| l.target == hash) {
                        Some(prev_position) => prev_position + 1,
                        None => 0
                    }
                }
                None => 0,
            };

            let maybe_slice = match start_index+limit < links_copy.len() {
                true => links_copy.get(start_index..start_index+limit),
                false => links_copy.get(start_index..links_copy.len()),
            };

            match maybe_slice {
                Some(slice) => {
                    Ok(slice.to_vec())
                }
                None => Ok(vec![]),
            }
        }
        None => Ok(links),
    }
}
