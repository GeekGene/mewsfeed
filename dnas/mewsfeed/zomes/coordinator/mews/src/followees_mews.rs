use hdk::prelude::*;
use mews_integrity::*;
use crate::mew::get_mew_with_context;

#[hdk_extern]
pub fn get_followees_mews(agent: AgentPubKey) -> ExternResult<Vec<Record>> {
    let hashes = get_followees_mew_hashes(agent)?;
    let get_input: Vec<GetInput> = hashes
        .into_iter()
        .map(|hash| GetInput::new(
            ActionHash::from(hash).into(),
            GetOptions::default(),
        ))
        .collect();
    let records = HDK.with(|hdk| hdk.borrow().get(get_input))?;
    let records: Vec<Record> = records.into_iter().filter_map(|r| r).collect();

    Ok(records)
}

#[hdk_extern]
pub fn get_followees_mews_with_context(agent: AgentPubKey) -> ExternResult<Vec<FeedMew>> {
    let hashes = get_followees_mew_hashes(agent)?;

    let feedmews: Vec<FeedMew> = hashes
        .into_iter()
        .filter_map(|hash| get_mew_with_context(hash).ok())
        .collect();

    Ok(feedmews)
}

fn get_followees_mew_hashes(agent: AgentPubKey) -> ExternResult<Vec<ActionHash>> {
    // Call follows zome to get list of followers
    let zome_call_response = call(
        CallTargetCell::Local,
        "follows",
        FunctionName::from("get_followees_for_follower"),
        None,
        agent.clone(),
    )?;

    match zome_call_response {
        ZomeCallResponse::Ok(response) =>  {
            let mut followees: Vec<AgentPubKey> = response.decode().map_err(|_| wasm_error!(WasmErrorInner::Guest("Failed to deserialize zome call response".into())))?;
            followees.push(agent);
            let mut links: Vec<Link> =  followees
                .into_iter()
                .filter_map(|agent| get_links(AnyLinkableHash::from(agent), LinkTypes::AgentMews, None).ok())
                .flatten()
                .collect();
            links.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
            let hashes: Vec<ActionHash> = links
                .into_iter()
                .map(|link|ActionHash::from(link.target).into())
                .collect();
        
            Ok(hashes)
        }
        _ => {
            Err(wasm_error!(WasmErrorInner::Guest("Failed to call get_followees_for_follower in zome 'follows'".into())))
        }
    }
}
#[hdk_extern]
pub fn get_my_followees_mews_with_context(_: ()) -> ExternResult<Vec<FeedMew>> {
    get_followees_mews_with_context(agent_info()?.agent_initial_pubkey)
}