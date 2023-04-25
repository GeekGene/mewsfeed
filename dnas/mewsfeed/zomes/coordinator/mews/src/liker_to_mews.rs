use hdk::prelude::*;
use mews_integrity::*;

#[derive(Serialize, Deserialize, Debug)]
pub struct AddMewForLikerInput {
    pub base_liker: AgentPubKey,
    pub target_mew_hash: ActionHash,
}
#[hdk_extern]
pub fn add_mew_for_liker(input: AddMewForLikerInput) -> ExternResult<()> {
    create_link(
        input.base_liker.clone(),
        input.target_mew_hash.clone(),
        LinkTypes::LikerToMews,
        (),
    )?;
    create_link(input.target_mew_hash, input.base_liker, LinkTypes::MewToLikers, ())?;
    Ok(())
}
#[hdk_extern]
pub fn get_hashes_for_liker(liker: AgentPubKey) -> ExternResult<Vec<ActionHash>> {
    let links = get_links(liker, LinkTypes::LikerToMews, None)?;
    let hashes: Vec<ActionHash> = links
        .into_iter()
        .map(|link| ActionHash::from(link.target))
        .collect();

    Ok(hashes)
}
#[hdk_extern]
pub fn get_mews_for_liker(liker: AgentPubKey) -> ExternResult<Vec<Record>> {
    let hashes = get_hashes_for_liker(liker)?;
    let get_input: Vec<GetInput> = hashes
        .into_iter()
        .map(|hash| GetInput::new(
            hash.into(),
            GetOptions::default(),
        ))
        .collect();
    let records: Vec<Record> = HDK
        .with(|hdk| hdk.borrow().get(get_input))?
        .into_iter()
        .filter_map(|r| r)
        .collect();
    Ok(records)
}
#[hdk_extern]
pub fn get_likers_for_mew(mew_hash: ActionHash) -> ExternResult<Vec<AgentPubKey>> {
    let links = get_links(mew_hash, LinkTypes::MewToLikers, None)?;
    let agents: Vec<AgentPubKey> = links
        .into_iter()
        .map(|link| AgentPubKey::from(EntryHash::from(link.target)))
        .collect();
    Ok(agents)
}
#[derive(Serialize, Deserialize, Debug)]
pub struct RemoveMewForLikerInput {
    pub base_liker: AgentPubKey,
    pub target_mew_hash: ActionHash,
}
#[hdk_extern]
pub fn remove_mew_for_liker(input: RemoveMewForLikerInput) -> ExternResult<()> {
    let links = get_links(input.base_liker.clone(), LinkTypes::LikerToMews, None)?;
    for link in links {
        if ActionHash::from(link.target.clone()).eq(&input.target_mew_hash) {
            delete_link(link.create_link_hash)?;
        }
    }
    let links = get_links(input.target_mew_hash.clone(), LinkTypes::MewToLikers, None)?;
    for link in links {
        if AgentPubKey::from(EntryHash::from(link.target.clone())).eq(&input.base_liker)
        {
            delete_link(link.create_link_hash)?;
        }
    }
    Ok(())
}
#[hdk_extern]
pub fn like_mew(mew_hash: ActionHash) -> ExternResult<()> {
    add_mew_for_liker(AddMewForLikerInput { base_liker: agent_info()?.agent_initial_pubkey, target_mew_hash: mew_hash})
}
#[hdk_extern]
pub fn unlike_mew(mew_hash: ActionHash) -> ExternResult<()> {
    remove_mew_for_liker(RemoveMewForLikerInput { base_liker: agent_info()?.agent_initial_pubkey, target_mew_hash: mew_hash})
}
