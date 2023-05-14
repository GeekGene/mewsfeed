use crate::mew_with_context::get_batch_mews_with_context;
use hdk::prelude::*;
use mews_integrity::*;

#[derive(Serialize, Deserialize, Debug)]
pub struct AddMewForPinnerInput {
    pub base_pinner: AgentPubKey,
    pub target_mew_hash: ActionHash,
}
#[hdk_extern]
pub fn add_mew_for_pinner(input: AddMewForPinnerInput) -> ExternResult<()> {
    create_link(
        input.base_pinner,
        input.target_mew_hash,
        LinkTypes::PinnerToMews,
        (),
    )?;

    Ok(())
}

#[hdk_extern]
pub fn get_mews_for_pinner(pinner: AgentPubKey) -> ExternResult<Vec<Record>> {
    let hashes = get_mew_hashes_for_pinner(pinner)?;
    let get_input: Vec<GetInput> = hashes
        .into_iter()
        .map(|h| GetInput::new(h.into(), GetOptions::default()))
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
pub fn get_mew_hashes_for_pinner(pinner: AgentPubKey) -> ExternResult<Vec<ActionHash>> {
    let links: Vec<Link> = get_links(pinner, LinkTypes::PinnerToMews, None)?;

    let hashes: Vec<ActionHash> = links
        .into_iter()
        .map(|link| ActionHash::from(link.target))
        .collect();

    Ok(hashes)
}

#[hdk_extern]
pub fn get_mews_for_pinner_with_context(pinner: AgentPubKey) -> ExternResult<Vec<FeedMew>> {
    let hashes = get_mew_hashes_for_pinner(pinner)?;

    get_batch_mews_with_context(hashes)
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RemoveMewForPinnerInput {
    pub base_pinner: AgentPubKey,
    pub target_mew_hash: ActionHash,
}
#[hdk_extern]
pub fn remove_mew_for_pinner(input: RemoveMewForPinnerInput) -> ExternResult<()> {
    let links = get_links(input.base_pinner.clone(), LinkTypes::PinnerToMews, None)?;

    for link in links {
        if ActionHash::from(link.target.clone()).eq(&input.target_mew_hash) {
            delete_link(link.create_link_hash)?;
        }
    }

    Ok(())
}

#[hdk_extern]
pub fn pin_mew(hash: ActionHash) -> ExternResult<()> {
    add_mew_for_pinner(AddMewForPinnerInput {
        base_pinner: agent_info()?.agent_initial_pubkey,
        target_mew_hash: hash,
    })
}

#[hdk_extern]
pub fn unpin_mew(hash: ActionHash) -> ExternResult<()> {
    remove_mew_for_pinner(RemoveMewForPinnerInput {
        base_pinner: agent_info()?.agent_initial_pubkey,
        target_mew_hash: hash,
    })
}

#[hdk_extern]
pub fn is_mew_pinned(hash: ActionHash) -> ExternResult<bool> {
    let hashes = get_mew_hashes_for_pinner(agent_info()?.agent_initial_pubkey)?;
    let is_pinned: bool = hashes.iter().any(|h| hash == h.clone());

    Ok(is_pinned)
}
