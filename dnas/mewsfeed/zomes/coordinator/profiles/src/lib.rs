use hc_zome_input::ZomeFnInput;
use hdk::prelude::*;

extern crate hc_zome_profiles_coordinator;

#[hdk_extern]
pub fn get_joining_timestamp_for_agent(
    input: ZomeFnInput<AgentPubKey>,
) -> ExternResult<Option<Timestamp>> {
    let get_options = input.get_options();
    let Some(record) = get(input.input, get_options)? else {
        return Ok(None);
    };

    Ok(Some(record.action_hashed().timestamp()))
}
