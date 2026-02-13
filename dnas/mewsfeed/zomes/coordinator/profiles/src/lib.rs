use hc_zome_input::ZomeFnInput;
use hdk::prelude::*;

extern crate hc_zome_profiles_coordinator;

/// Custom GetAgentActivityInput that includes get_options field
/// required by holochain 0.6.1-rc.1 conductor.
#[derive(Serialize, Deserialize, Debug)]
struct GetAgentActivityInputWithOptions {
    agent_pubkey: AgentPubKey,
    chain_query_filter: ChainQueryFilter,
    activity_request: ActivityRequest,
    get_options: GetOptions,
}

#[hdk_extern]
pub fn get_joining_timestamp_for_agent(
    input: ZomeFnInput<AgentPubKey>,
) -> ExternResult<Option<Timestamp>> {
    let get_options = input.get_options();

    let activity_input = GetAgentActivityInputWithOptions {
        agent_pubkey: input.input,
        chain_query_filter: ChainQueryFilter::new()
            .action_type(ActionType::AgentValidationPkg)
            .include_entries(true),
        activity_request: ActivityRequest::Full,
        get_options,
    };

    let joining_agent_activity: AgentActivity =
        host_call::<GetAgentActivityInputWithOptions, AgentActivity>(
            __hc__get_agent_activity_1,
            activity_input,
        )?;

    let Some(action) = joining_agent_activity.valid_activity.first() else {
        return Ok(None);
    };

    let Some(record) = get(action.clone().1, GetOptions::default())? else {
        return Ok(None);
    };

    Ok(Some(record.action_hashed().timestamp()))
}
