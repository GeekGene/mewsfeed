use hc_zome_input::ZomeFnInput;
use hdk::prelude::*;

extern crate hc_zome_profiles_coordinator;

#[hdk_extern]
pub fn get_joining_timestamp_for_agent(input: ZomeFnInput<AgentPubKey>) -> ExternResult<Option<Timestamp>> {
    let joining_agent_activity: AgentActivity = get_agent_activity(
        input.input,
        ChainQueryFilter::new()
            .action_type(ActionType::AgentValidationPkg)
            .include_entries(true),
        ActivityRequest::Full,
    )?;

    let Some(action) = joining_agent_activity.valid_activity.first() else {
        return Ok(None);
    };

    let Some(record) = get(action.clone().1, GetOptions::default())? else {
        return Ok(None);
    };

    Ok(Some(record.action_hashed().timestamp()))
}
