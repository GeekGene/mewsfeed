use crate::{Hashed, Timestamped};
use hdk::prelude::*;

#[derive(Serialize, Deserialize, SerializedBytes, Debug, Clone)]
pub struct HashPagination {
    pub after_hash: Option<AnyLinkableHash>,
    pub limit: usize,
}

pub fn get_by_hash_pagination<T>(
    mut items: Vec<T>,
    page: Option<HashPagination>,
) -> ExternResult<Vec<T>>
where
    T: Clone + Hashed + Timestamped,
{
    items.sort_by_key(|l| l.timestamp());

    match page {
        Some(HashPagination { after_hash, limit }) => {
            let start_index = match after_hash {
                Some(hash) => match items.iter().position(|l| l.hash() == hash) {
                    Some(prev_position) => prev_position + 1,
                    None => 0,
                },
                None => 0,
            };

            let maybe_slice = match start_index + limit < items.len() {
                true => items.get(start_index..start_index + limit),
                false => items.get(start_index..items.len()),
            };

            match maybe_slice {
                Some(slice) => Ok(slice.to_vec()),
                None => Ok(vec![]),
            }
        }
        None => Ok(items),
    }
}



#[derive(Serialize, Deserialize, SerializedBytes, Debug, Clone)]
pub struct AgentPubKeyPagination {
    pub after_agentpubkey: Option<AgentPubKey>,
    pub limit: usize,
}

pub fn get_by_agentpubkey_pagination<T>(
    items: Vec<T>,
    page: Option<AgentPubKeyPagination>
) -> ExternResult<Vec<T>>
where
    T: Clone + Hashed + Timestamped,
{
    let wrapped_page = match page {
        Some(p) => {
            match p.after_agentpubkey {
                Some(agentpubkey) => Some(HashPagination {
                    after_hash: Some(AnyLinkableHash::from(EntryHash::from(agentpubkey))),
                    limit: p.limit
                }),
                None => Some(HashPagination {
                    limit: p.limit,
                    after_hash: None
                })
            }
        }
        None => None
    };

    get_by_hash_pagination(items, wrapped_page)
}