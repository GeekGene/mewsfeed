use hdk::prelude::*;
use mews_integrity::*;
#[derive(Serialize, Deserialize, Debug)]
pub struct AddResponseForMewInput {
    pub base_original_mew_hash: ActionHash,
    pub target_response_mew_hash: ActionHash,
    pub response_type: ResponseType,
}
#[hdk_extern]
pub fn add_response_for_mew(input: AddResponseForMewInput) -> ExternResult<()> {
    let tag: SerializedBytes = input.response_type.try_into().map_err(|_| {
        wasm_error!(WasmErrorInner::Guest(
            "Failed to seriailize response_type".into()
        ))
    })?;

    create_link(
        input.base_original_mew_hash.clone(),
        input.target_response_mew_hash,
        LinkTypes::MewToResponses,
        tag.bytes().clone(),
    )?;
    Ok(())
}

#[derive(Serialize, Deserialize, Debug)]
pub struct GetResponsesForMewInput {
    pub original_mew_hash: ActionHash,
    pub response_type: Option<ResponseType>,
}
#[hdk_extern]
pub fn get_response_hashes_for_mew(
    input: GetResponsesForMewInput,
) -> ExternResult<Vec<ActionHash>> {
    let tag = match input.response_type {
        Some(response_type) => {
            let tag: SerializedBytes = response_type.try_into().map_err(|_| {
                wasm_error!(WasmErrorInner::Guest(
                    "Failed to seriailize response_type".into()
                ))
            })?;

            Some(LinkTag::from(tag.bytes().clone()))
        }
        None => None,
    };

    let links = get_links(input.original_mew_hash, LinkTypes::MewToResponses, tag)?;
    let hashes: Vec<ActionHash> = links
        .into_iter()
        .map(|link| ActionHash::from(link.target))
        .collect();

    Ok(hashes)
}
#[hdk_extern]
pub fn get_responses_for_mew(input: GetResponsesForMewInput) -> ExternResult<Vec<Record>> {
    let response_hashes = get_response_hashes_for_mew(input)?;
    let get_input: Vec<GetInput> = response_hashes
        .into_iter()
        .map(|hash| GetInput::new(hash.into(), GetOptions::default()))
        .collect();
    let records: Vec<Record> = HDK
        .with(|hdk| hdk.borrow().get(get_input))?
        .into_iter()
        .flatten()
        .collect();
    Ok(records)
}
#[derive(Serialize, Deserialize, Debug)]
pub struct RemoveResponseForMewInput {
    pub base_original_mew_hash: ActionHash,
    pub target_response_mew_hash: ActionHash,
}
#[hdk_extern]
pub fn remove_response_for_mew(input: RemoveResponseForMewInput) -> ExternResult<()> {
    let links = get_links(
        input.base_original_mew_hash.clone(),
        LinkTypes::MewToResponses,
        None,
    )?;
    for link in links {
        if ActionHash::from(link.target.clone()).eq(&input.target_response_mew_hash) {
            delete_link(link.create_link_hash)?;
        }
    }
    Ok(())
}
