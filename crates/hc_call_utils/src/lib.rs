use hdk::prelude::*;

pub fn call_local_zome<T, A>(zome_name: &str, fn_name: &str, input: A) -> ExternResult<T>
where
    T: serde::de::DeserializeOwned + std::fmt::Debug,
    A: serde::Serialize + std::fmt::Debug,
{
    let response = call(
        CallTargetCell::Local,
        ZomeName::from(zome_name),
        FunctionName::from(fn_name),
        None,
        input,
    )?;

    let result_io = match response {
        ZomeCallResponse::Ok(bytes) => Ok(bytes),
        ZomeCallResponse::Unauthorized(zome_call_auth, cell_id, zome, func, agent) => Err(
            wasm_error!("ZomeCallResponse::Unauthorized: zome_call_auth: {:?}, cell_id: {:?}, zome: {:?}, func: {:?}, agent: {:?}", zome_call_auth, cell_id, zome, func, agent))
        ,
        ZomeCallResponse::NetworkError(message) => Err(wasm_error!("ZomeCallResponse::NetworkError: {}", message)),
        ZomeCallResponse::CountersigningSession(message) => {
            Err(wasm_error!("ZomeCallResponse::CountersigningSession: {}", message))
        }
    }?;

    let result: T = result_io.decode().map_err(|error|
        wasm_error!(
            "Could not decode response to local zome call (zome: {}) (function: {}) (response length in bytes: {}): (message: {})",
            zome_name,
            fn_name,
            result_io.as_bytes().len(),
            error
        )
    )?;

    Ok(result)
}