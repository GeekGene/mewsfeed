use hdk::prelude::*;
use hdk::prelude::holo_hash::*;

#[hdk_entry(id = "mew")]
pub struct Mew(String);

entry_defs![
    Mew::entry_def()
];

#[hdk_extern]
// TODO: we want a parsing function here to identify user references, tag references, etc to build posts, links, etc
pub fn create_mew(mew: Mew) -> ExternResult<EntryHashB64> {
    create_entry(&mew)?;
    let hash = hash_entry(&mew)?;

    Ok(EntryHashB64::from(hash))
}

// TODO: open question: do we want to allow edits, "deletes"?

#[hdk_extern]
pub fn get_mew(entry_hash: EntryHashB64) -> ExternResult<Mew> {
    let element = get(EntryHash::from(entry_hash), GetOptions::default())?.ok_or(WasmError::Guest(String::from("Mew not found")))?;

    let mew: Mew = element.entry().to_app_option()?.ok_or(WasmError::Guest(String::from("Malformed mew")))?;

    Ok(mew)
}
