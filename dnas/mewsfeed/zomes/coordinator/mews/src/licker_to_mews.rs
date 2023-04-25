use hdk::prelude::*;

#[hdk_extern]
pub fn get_lickers_for_mew(mew_hash: ActionHash) -> ExternResult<Vec<AgentPubKey>> {
  let zome_call_response = call(
      CallTargetCell::Local,
      "likes",
      FunctionName::from("get_likers_for_hash"),
      None,
      mew_hash.clone(),
  )?;

  match zome_call_response {
      ZomeCallResponse::Ok(response) =>  {
          let likers: Vec<AgentPubKey> = response.decode().map_err(|_| wasm_error!(WasmErrorInner::Guest("Failed to deserialize zome call response".into())))?;
          
          Ok(likers)
      }
      _ => {
          Err(wasm_error!(WasmErrorInner::Guest("Failed to call 'get_likers_for_hash' in zome 'likes'".into())))
      }
  }
}
