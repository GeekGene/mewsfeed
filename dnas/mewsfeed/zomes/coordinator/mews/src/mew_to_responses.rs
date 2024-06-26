use hc_link_pagination::{paginate_by_hash, HashPagination};
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
    pub page: Option<HashPagination>,
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

    let links = get_links(GetLinksInput {
        base_address: input.original_mew_hash.into(),
        link_type: LinkTypes::MewToResponses.try_into_filter()?,
        tag_prefix: tag,
        after: None,
        before: None,
        author: None,
        get_options: GetOptions::default(),
    })?;
    let links_page = paginate_by_hash(links, input.page)?;
    let hashes: Vec<ActionHash> = links_page
        .into_iter()
        .filter_map(|link| ActionHash::try_from(link.target).ok())
        .collect();

    Ok(hashes)
}

#[derive(Serialize, Deserialize, Debug)]
pub struct CountResponsesForMewInput {
    pub original_mew_hash: ActionHash,
    pub response_type: Option<ResponseType>,
}
#[hdk_extern]
pub fn count_responses_for_mew(input: CountResponsesForMewInput) -> ExternResult<usize> {
    let maybe_tag = match input.response_type {
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

    let mut query = LinkQuery::new(
        input.original_mew_hash,
        LinkTypes::MewToResponses.try_into_filter()?,
    );

    if let Some(tag) = maybe_tag {
        query = query.tag_prefix(tag)
    }

    count_links(query)
}

#[derive(Serialize, Deserialize, Debug)]
pub struct GetResponseForMewExistsInput {
    pub original_mew_hash: ActionHash,
    pub response_type: Option<ResponseType>,
    pub response_author: AgentPubKey,
}
#[hdk_extern]
pub fn get_response_for_mew_exists(input: GetResponseForMewExistsInput) -> ExternResult<bool> {
    let maybe_tag = match input.response_type {
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

    let mut query = LinkQuery::new(
        input.original_mew_hash.clone(),
        LinkTypes::MewToResponses.try_into_filter()?,
    )
    .author(input.response_author);

    if let Some(tag) = maybe_tag {
        query = query.tag_prefix(tag)
    }

    let count = count_links(query)?;

    Ok(count > 0)
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
    let links = get_links(GetLinksInput {
        base_address: input.base_original_mew_hash.into(),
        link_type: LinkTypes::MewToResponses.try_into_filter()?,
        tag_prefix: None,
        after: None,
        before: None,
        author: None,
        get_options: GetOptions::default(),
    })?;
    for link in links {
        let action_hash =
            ActionHash::try_from(link.target.clone()).map_err(|err| wasm_error!(err))?;
        if action_hash.eq(&input.target_response_mew_hash) {
            delete_link(link.create_link_hash)?;
        }
    }
    Ok(())
}
