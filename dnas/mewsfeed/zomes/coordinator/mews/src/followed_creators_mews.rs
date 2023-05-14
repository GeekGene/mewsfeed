use crate::mew_with_context::get_batch_mews_with_context;
use hdk::prelude::*;
use mews_integrity::*;

#[hdk_extern]
pub fn get_followed_creators_mews(agent: AgentPubKey) -> ExternResult<Vec<Record>> {
    let hashes = get_followed_creators_mew_hashes(agent)?;
    let get_input: Vec<GetInput> = hashes
        .into_iter()
        .map(|hash| GetInput::new(hash.into(), GetOptions::default()))
        .collect();
    let records = HDK.with(|hdk| hdk.borrow().get(get_input))?;
    let records: Vec<Record> = records.into_iter().flatten().collect();

    Ok(records)
}

#[hdk_extern]
pub fn get_followed_creators_mews_with_context(agent: AgentPubKey) -> ExternResult<Vec<FeedMew>> {
    let hashes = get_followed_creators_mew_hashes(agent)?;
    
    get_batch_mews_with_context(hashes)
}

fn get_followed_creators_mew_hashes(agent: AgentPubKey) -> ExternResult<Vec<ActionHash>> {
    let zome_call_response = call(
        CallTargetCell::Local,
        "follows",
        FunctionName::from("get_creators_for_follower"),
        None,
        agent.clone(),
    )?;

    match zome_call_response {
        ZomeCallResponse::Ok(response) => {
            let mut creators: Vec<AgentPubKey> = response.decode().map_err(|_| {
                wasm_error!(WasmErrorInner::Guest(
                    "Failed to deserialize zome call response".into()
                ))
            })?;
            creators.push(agent);
            let mut links: Vec<Link> = creators
                .into_iter()
                .filter_map(|agent| {
                    get_links(AnyLinkableHash::from(agent), LinkTypes::AgentMews, None).ok()
                })
                .flatten()
                .collect();
            links.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
            let hashes: Vec<ActionHash> = links
                .into_iter()
                .map(|link| ActionHash::from(link.target))
                .collect();

            Ok(hashes)
        }
        _ => Err(wasm_error!(WasmErrorInner::Guest(
            "Failed to call 'get_creators_for_follower' in zome 'follows'".into()
        ))),
    }
}
#[hdk_extern]
pub fn get_my_followed_creators_mews_with_context(_: ()) -> ExternResult<Vec<FeedMew>> {
    get_followed_creators_mews_with_context(agent_info()?.agent_initial_pubkey)
}
