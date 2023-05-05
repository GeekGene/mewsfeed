use crate::mew::get_mew_with_context;
use hdk::prelude::*;
use mews_integrity::*;

#[derive(Serialize, Deserialize, Debug)]
pub struct AddCashtagForMewInput {
    pub base_cashtag: String,
    pub target_mew_hash: ActionHash,
}
#[hdk_extern]
pub fn add_cashtag_for_mew(input: AddCashtagForMewInput) -> ExternResult<()> {
    // Add cashtag to prefix index
    let tag_text = make_cashtag_text(input.base_cashtag.clone());
    let prefix_index = make_tag_prefix_index()?;
    let path = prefix_index.add_result_with_label(tag_text, input.base_cashtag.clone())?;

    // Link from cashtag to mew_hash
    create_link(
        path.path_entry_hash()?,
        input.target_mew_hash,
        LinkTypes::CashtagToMews,
        LinkTag(input.base_cashtag.as_bytes().to_vec()),
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
    let tag = make_cashtag_text(input.base_cashtag.clone());
    let prefix_index = make_tag_prefix_index()?;
    let result_path = prefix_index.make_result_path(tag, Some(input.base_cashtag.clone()))?;

    let links = get_links(
        result_path.path_entry_hash()?,
        LinkTypes::CashtagToMews,
        Some(LinkTag(input.base_cashtag.as_bytes().to_vec())),
    )?;
    for link in links {
        if ActionHash::from(link.target.clone()).eq(&input.target_mew_hash) {
            delete_link(link.create_link_hash)?;
        }
    }

    Ok(())
}

#[hdk_extern]
pub fn get_mews_for_cashtag(cashtag: String) -> ExternResult<Vec<Record>> {
    // Get links from cashtag to mew
    let tag = make_cashtag_text(cashtag.clone());
    let prefix_index = make_tag_prefix_index()?;
    let result_path = prefix_index.make_result_path(tag, Some(cashtag))?;

    let links = get_links(
        result_path.path_entry_hash()?,
        LinkTypes::CashtagToMews,
        None,
    )?;
    let get_input: Vec<GetInput> = links
        .into_iter()
        .map(|l| GetInput::new(ActionHash::from(l.target).into(), GetOptions::default()))
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
    // Get links from cashtag to mew
    let tag = make_cashtag_text(cashtag.clone());
    let prefix_index = make_tag_prefix_index()?;
    let result_path = prefix_index.make_result_path(tag, Some(cashtag))?;

    let links = get_links(
        result_path.path_entry_hash()?,
        LinkTypes::CashtagToMews,
        None,
    )?;

    // Get mews with context
    let feedmews: Vec<FeedMew> = links
        .into_iter()
        .filter_map(|l| get_mew_with_context(ActionHash::from(l.target)).ok())
        .collect();

    Ok(feedmews)
}

fn make_cashtag_text(text: String) -> String {
    text.split('$').nth(1).unwrap_or(&text).to_string()
}
