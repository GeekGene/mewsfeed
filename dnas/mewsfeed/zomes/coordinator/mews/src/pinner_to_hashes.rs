use hc_zome_input::ZomeFnInput;
use hdk::prelude::*;
use mews_integrity::*;

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
pub fn get_hashes_for_pinner(
    input: ZomeFnInput<AgentPubKey>,
) -> ExternResult<Vec<AnyLinkableHash>> {
    let strategy = input.get_strategy();
    let links = get_links(
        LinkQuery::new(
            AnyLinkableHash::from(input.input),
            LinkTypes::PinnerToHashes.try_into_filter()?,
        ),
        strategy,
    )?;

    let hashes: Vec<AnyLinkableHash> = links.into_iter().map(|link| link.target).collect();

    Ok(hashes)
}

#[hdk_extern]
pub fn get_pinners_for_hash(input: ZomeFnInput<AnyLinkableHash>) -> ExternResult<Vec<AgentPubKey>> {
    let links = get_pinner_links_for_hash(input)?;

    let agents: Vec<AgentPubKey> = links
        .into_iter()
        .filter_map(|link| EntryHash::try_from(link.target).ok())
        .map(AgentPubKey::from)
        .collect();

    Ok(agents)
}

#[hdk_extern]
pub fn get_pinner_links_for_hash(input: ZomeFnInput<AnyLinkableHash>) -> ExternResult<Vec<Link>> {
    let strategy = input.get_strategy();
    let mut links = get_links(
        LinkQuery::new(input.input, LinkTypes::HashToPinners.try_into_filter()?),
        strategy,
    )?;

    links.dedup_by_key(|l| l.target.clone());

    Ok(links)
}

#[hdk_extern]
pub fn get_pinner_link_details_for_hash(
    input: ZomeFnInput<AnyLinkableHash>,
) -> ExternResult<LinkDetails> {
    let strategy = input.get_strategy();
    get_links_details(
        LinkQuery::new(input.input, LinkTypes::HashToPinners.try_into_filter()?),
        strategy,
    )
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RemoveHashForPinnerInput {
    pub base_pinner: AgentPubKey,
    pub target_hash: AnyLinkableHash,
}
#[hdk_extern]
pub fn remove_hash_for_pinner(input: RemoveHashForPinnerInput) -> ExternResult<()> {
    let links = get_links(
        LinkQuery::new(
            AnyLinkableHash::from(input.base_pinner.clone()),
            LinkTypes::PinnerToHashes.try_into_filter()?,
        ),
        GetStrategy::Local,
    )?;

    for link in links {
        if link.target.eq(&input.target_hash) {
            delete_link(link.create_link_hash, GetOptions::local())?;
        }
    }

    let links = get_links(
        LinkQuery::new(
            input.target_hash.clone(),
            LinkTypes::HashToPinners.try_into_filter()?,
        ),
        GetStrategy::Local,
    )?;

    for link in links {
        if link.target.eq(&AnyLinkableHash::from(EntryHash::from(
            input.base_pinner.clone(),
        ))) {
            delete_link(link.create_link_hash, GetOptions::local())?;
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
    let hashes = get_hashes_for_pinner(ZomeFnInput::new(
        agent_info()?.agent_initial_pubkey,
        Some(true),
    ))?;
    let is_pinned = hashes.iter().any(|h| hash == h.clone());

    Ok(is_pinned)
}
