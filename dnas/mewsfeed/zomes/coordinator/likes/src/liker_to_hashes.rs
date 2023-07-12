use hdk::prelude::*;
use likes_integrity::*;

#[derive(Serialize, Deserialize, Debug)]
pub struct AddHashForLikerInput {
    pub base_liker: AgentPubKey,
    pub target_hash: AnyLinkableHash,
}
#[hdk_extern]
pub fn add_hash_for_liker(input: AddHashForLikerInput) -> ExternResult<()> {
    create_link(
        input.base_liker.clone(),
        input.target_hash.clone(),
        LinkTypes::LikerToHashes,
        (),
    )?;
    create_link(
        input.target_hash,
        input.base_liker,
        LinkTypes::HashToLikers,
        (),
    )?;

    Ok(())
}

#[hdk_extern]
pub fn get_hashes_for_liker(liker: AgentPubKey) -> ExternResult<Vec<AnyLinkableHash>> {
    let links = get_links(liker, LinkTypes::LikerToHashes, None)?;

    let hashes: Vec<AnyLinkableHash> = links.into_iter().map(|link| link.target).collect();

    Ok(hashes)
}

#[hdk_extern]
pub fn get_likers_for_hash(hash: AnyLinkableHash) -> ExternResult<Vec<AgentPubKey>> {
    let links = get_liker_links_for_hash(hash)?;
    let agents: Vec<AgentPubKey> = links
        .into_iter()
        .filter_map(|link| EntryHash::try_from(link.target).ok())
        .map(AgentPubKey::from)
        .collect();

    Ok(agents)
}

#[hdk_extern]
pub fn get_liker_links_for_hash(hash: AnyLinkableHash) -> ExternResult<Vec<Link>> {
    let mut links = get_links(hash, LinkTypes::HashToLikers, None)?;
    links.dedup_by_key(|l| l.target.clone());

    Ok(links)
}

#[hdk_extern]
pub fn get_liker_link_details_for_hash(hash: AnyLinkableHash) -> ExternResult<LinkDetails> {
    get_link_details(hash, LinkTypes::HashToLikers, None)
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RemoveHashForLikerInput {
    pub base_liker: AgentPubKey,
    pub target_hash: AnyLinkableHash,
}
#[hdk_extern]
pub fn remove_hash_for_liker(input: RemoveHashForLikerInput) -> ExternResult<()> {
    let links = get_links(input.base_liker.clone(), LinkTypes::LikerToHashes, None)?;

    for link in links {
        if link.target.clone().eq(&input.target_hash) {
            delete_link(link.create_link_hash)?;
        }
    }

    let links = get_links(input.target_hash.clone(), LinkTypes::HashToLikers, None)?;

    for link in links {
        let entry_hash =
            EntryHash::try_from(link.target.clone()).map_err(|err| wasm_error!(err))?;
        if AgentPubKey::from(entry_hash).eq(&input.base_liker) {
            delete_link(link.create_link_hash)?;
        }
    }

    Ok(())
}

#[hdk_extern]
pub fn like(hash: AnyLinkableHash) -> ExternResult<()> {
    add_hash_for_liker(AddHashForLikerInput {
        base_liker: agent_info()?.agent_initial_pubkey,
        target_hash: hash,
    })
}

#[hdk_extern]
pub fn unlike(hash: AnyLinkableHash) -> ExternResult<()> {
    remove_hash_for_liker(RemoveHashForLikerInput {
        base_liker: agent_info()?.agent_initial_pubkey,
        target_hash: hash,
    })
}

#[hdk_extern]
pub fn get_my_liked_hashes(_: ()) -> ExternResult<Vec<AnyLinkableHash>> {
    get_hashes_for_liker(agent_info()?.agent_initial_pubkey)
}
