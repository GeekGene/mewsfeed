use crate::mew::get_mew_with_context;
use hdk::prelude::*;
use mews_integrity::*;
use prefix_index::*;

#[derive(Serialize, Deserialize, Debug)]
pub struct AddCashtagForMewInput {
    pub base_cashtag: String,
    pub target_mew_hash: ActionHash,
}

#[hdk_extern]
pub fn add_cashtag_for_mew(input: AddCashtagForMewInput) -> ExternResult<()> {
    // Link from cashtag to mew
    create_link(
        Path::from(input.base_cashtag.clone()).path_entry_hash()?,
        input.target_mew_hash.clone(),
        LinkTypes::CashtagToMews,
        input.base_cashtag.as_bytes().to_vec(),
    )?;

    // Add cashtag to prefix index, link to mew_hash
    let tag: &str = input.base_cashtag.split('$').nth(1).unwrap();
    add_hash_for_prefix_index(
        tag.into(),
        input.target_mew_hash,
        LinkTypes::PrefixIndexToCashtags,
    )?;

    Ok(())
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RemoveCashtagForMewInput {
    pub base_cashtag: String,
    pub target_mew_hash: ActionHash,
}
#[hdk_extern]
pub fn remove_cashtag_for_mew(input: RemoveCashtagForMewInput) -> ExternResult<()> {
    let links = get_links(
        Path::from(input.base_cashtag.clone()).path_entry_hash()?,
        LinkTypes::CashtagToMews,
        Some(LinkTag(input.base_cashtag.as_bytes().to_vec())),
    )?;
    for link in links {
        if ActionHash::from(link.target.clone()).eq(&input.target_mew_hash) {
            delete_link(link.create_link_hash)?;
        }
    }

    remove_hash_for_prefix_index(
        input.base_cashtag,
        AnyLinkableHash::from(input.target_mew_hash),
    )?;

    Ok(())
}

#[hdk_extern]
pub fn get_mews_for_cashtag(cashtag: String) -> ExternResult<Vec<Record>> {
    let hashes = get_mew_hashes_for_cashtag(cashtag)?;
    let get_input: Vec<GetInput> = hashes
        .into_iter()
        .map(|hash| GetInput::new(hash.into(), GetOptions::default()))
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
pub fn get_mews_for_cashtag_with_context(cashtag: String) -> ExternResult<Vec<FeedMew>> {
    let hashes = get_mew_hashes_for_cashtag(cashtag)?;

    let feedmews: Vec<FeedMew> = hashes
        .into_iter()
        .filter_map(|hash| get_mew_with_context(hash).ok())
        .collect();

    Ok(feedmews)
}

fn get_mew_hashes_for_cashtag(cashtag: String) -> ExternResult<Vec<ActionHash>> {
    let links: Vec<Link> = get_links(
        Path::from(cashtag).path_entry_hash()?,
        LinkTypes::CashtagToMews,
        None,
    )?;

    let hashes: Vec<ActionHash> = links
        .into_iter()
        .map(|link| ActionHash::from(link.target))
        .collect();

    Ok(hashes)
}

#[hdk_extern]
fn search_cashtags(query: String) -> ExternResult<Vec<String>> {
    let prefix: String = query.chars().take(3).collect();
    let path = Path::from(format!("prefix_index.{}", prefix));

    let links = get_links(
        path.path_entry_hash()?,
        LinkTypes::PrefixIndexToCashtags,
        None,
    )?;

    let tags: Vec<String> = links
        .into_iter()
        .map(|link| {
            String::from_utf8(link.tag.into_inner()).map_err(|_| {
                wasm_error!(WasmErrorInner::Guest(
                    "Failed to convert link tag to string".into()
                ))
            })
        })
        .filter_map(Result::ok)
        .collect();

    Ok(tags)
}
