use crate::tag_to_mews::*;
use hc_link_pagination::HashPagination;
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
    let tag_text = make_tag_text(input.base_cashtag.clone());
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
    let tag = make_tag_text(input.base_cashtag.clone());
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

#[derive(Serialize, Deserialize, Debug)]
pub struct GetMewsForCashtagWithContextInput {
    cashtag: String,
    page: Option<HashPagination>,
}
#[hdk_extern]
pub fn get_mews_for_cashtag_with_context(
    input: GetMewsForCashtagWithContextInput,
) -> ExternResult<Vec<FeedMew>> {
    get_mews_for_tag_with_context(input.cashtag, LinkTypes::CashtagToMews, input.page)
}
