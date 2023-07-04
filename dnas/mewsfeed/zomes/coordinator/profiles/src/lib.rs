use hdk::prelude::*;

extern crate hc_zome_profiles_coordinator;

#[hdk_extern]
pub fn get_joining_timestamp_for_agent(agent: AgentPubKey) -> ExternResult<Timestamp> {
    let joining_agent_activity: AgentActivity = get_agent_activity(
        agent,
        ChainQueryFilter::new()
            .action_type(ActionType::AgentValidationPkg)
            .include_entries(true),
        ActivityRequest::Full,
    )?;
    let action = joining_agent_activity
        .valid_activity
        .first()
        .ok_or(wasm_error!(WasmErrorInner::Guest(
            "AgentValidationPkg action not found".to_string()
        )))?;
    let record =
        get(action.clone().1, GetOptions::default())?.ok_or(wasm_error!(WasmErrorInner::Guest(
            "Failed to get AgentValidationPkg action from action hash".to_string()
        )))?;

    Ok(record.action_hashed().timestamp())
}
