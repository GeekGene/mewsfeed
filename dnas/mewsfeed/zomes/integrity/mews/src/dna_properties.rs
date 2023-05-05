use hdi::prelude::*;

#[derive(Debug, Serialize, Deserialize, SerializedBytes, Clone)]
pub struct DnaProperties {
    pub mew_characters_min: Option<usize>,
    pub mew_characters_max: Option<usize>,
}

#[hdk_extern]
pub fn get_dna_properties(_: ()) -> ExternResult<DnaProperties> {
    DnaProperties::try_from(dna_info()?.properties)
        .map_err(|e| wasm_error!(WasmErrorInner::Guest(e.into())))
}
