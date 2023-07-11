use agent_pins_integrity::*;
use hdk::prelude::*;

#[derive(Serialize, Deserialize, Debug)]
pub struct AddHashForPinnerInput {
    pub base_pinner: AgentPubKey,
    pub target_hash: AnyLinkableHash,
}
#[hdk_extern]
pub fn add_hash_for_pinner(input: AddHashForPinnerInput) -> ExternResult<()> {
    create_link(
        input.base_pinner.clone(),
        input.target_hash.clone(),
        LinkTypes::PinnerToHashes,
        (),
    )?;
    create_link(
        input.target_hash,
        input.base_pinner,
        LinkTypes::HashToPinners,
        (),
    )?;

    Ok(())
}

#[hdk_extern]
pub fn get_hashes_for_pinner(pinner: AgentPubKey) -> ExternResult<Vec<AnyLinkableHash>> {
    let links = get_links(pinner, LinkTypes::PinnerToHashes, None)?;

    let hashes: Vec<AnyLinkableHash> = links.into_iter().map(|link| link.target).collect();

    Ok(hashes)
}

#[hdk_extern]
pub fn get_pinners_for_hash(hash: AnyLinkableHash) -> ExternResult<Vec<AgentPubKey>> {
    let links = get_pinner_links_for_hash(hash)?;

    let agents: Vec<AgentPubKey> = links
        .into_iter()
        .filter_map(|link| EntryHash::try_from(link.target).ok())
        .map(|entry_hash| AgentPubKey::from(entry_hash))
        .collect();

    Ok(agents)
}

#[hdk_extern]
pub fn get_pinner_links_for_hash(hash: AnyLinkableHash) -> ExternResult<Vec<Link>> {
    let mut links = get_links(hash, LinkTypes::HashToPinners, None)?;
    links.dedup_by_key(|l| l.target.clone());

    Ok(links)
}

#[hdk_extern]
pub fn get_pinner_link_details_for_hash(hash: AnyLinkableHash) -> ExternResult<LinkDetails> {
    get_link_details(hash, LinkTypes::HashToPinners, None)
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RemoveHashForPinnerInput {
    pub base_pinner: AgentPubKey,
    pub target_hash: AnyLinkableHash,
}
#[hdk_extern]
pub fn remove_hash_for_pinner(input: RemoveHashForPinnerInput) -> ExternResult<()> {
    let links = get_links(input.base_pinner.clone(), LinkTypes::PinnerToHashes, None)?;

    for link in links {
        if link.target.eq(&input.target_hash) {
            delete_link(link.create_link_hash)?;
        }
    }

    let links = get_links(input.target_hash.clone(), LinkTypes::HashToPinners, None)?;

    for link in links {
        if link.target.eq(&AnyLinkableHash::from(EntryHash::from(
            input.base_pinner.clone(),
        ))) {
            delete_link(link.create_link_hash)?;
        }
    }

    Ok(())
}

#[hdk_extern]
pub fn pin_hash(hash: AnyLinkableHash) -> ExternResult<()> {
    add_hash_for_pinner(AddHashForPinnerInput {
        base_pinner: agent_info()?.agent_initial_pubkey,
        target_hash: hash,
    })
}

#[hdk_extern]
pub fn unpin_hash(hash: AnyLinkableHash) -> ExternResult<()> {
    remove_hash_for_pinner(RemoveHashForPinnerInput {
        base_pinner: agent_info()?.agent_initial_pubkey,
        target_hash: hash,
    })
}

#[hdk_extern]
pub fn is_hash_pinned(hash: AnyLinkableHash) -> ExternResult<bool> {
    let hashes = get_hashes_for_pinner(agent_info()?.agent_initial_pubkey)?;
    let is_pinned = hashes.iter().any(|h| hash == h.clone());

    Ok(is_pinned)
}
