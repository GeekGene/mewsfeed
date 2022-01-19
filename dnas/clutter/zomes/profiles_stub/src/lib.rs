use hdk::prelude::*;
use hdk::prelude::holo_hash::*;

#[hdk_entry(id = "handle")]
// define depth stuff here for the Handle(Path)? https://docs.rs/hdk/0.0.116/hdk/hash_path/shard/index.html
pub struct Handle(Path);

#[hdk_entry(id = "profile")]
// TODO: decide on pub
pub struct Profile {
    // TODO: define image type later in conjunction with the filestore zome
    avatar: String, // base 64 in-place image url
    location: String,
    bio: String,
    // TODO: i18n (replace String with something more systematic, e.g. https://lib.rs/crates/i18n-embed)
    lang_pref: String,
}

entry_defs![
    // Clutter handle for user
    Handle::entry_def(),
    Profile::entry_def()
];

// TODO: maybe create_profile thing for handle here with "2:3#" depth notation?

#[hdk_extern]
pub fn create_profile(profile: Profile) -> ExternResult<EntryHashB64> {
    create_entry(&profile)?;
    let hash = hash_entry(&profile)?;

    Ok(EntryHashB64::from(hash))
}

#[hdk_extern]
pub fn get_profile(entry_hash: EntryHashB64) -> ExternResult<Profile> {
    let element = get(EntryHash::from(entry_hash), GetOptions::default())?.ok_or(WasmError::Guest(String::from("Profile not found")))?;

    let profile: Profile = element.entry().to_app_option()?.ok_or(WasmError::Guest(String::from("Malformed profile")))?;

    Ok(profile)
}

/* 
#[hdk_extern]
pub fn update_profile(new_profile_data: Profile, updated_entry: EntryHashB64) -> ExternResult<EntryHashB64> {
    Ok()
}*/

// TODO: decide about delete_profile

#[hdk_extern]
pub fn create_handle(handle: Handle) -> ExternResult<EntryHashB64> {
    create_entry(&handle)?;
    let hash = hash_entry(&handle)?;

    // TODO: when you create a handle you add a link to your agent key base that points to the hash of the handle
    
    Ok(EntryHashB64::from(hash))
}

#[hdk_extern]
pub fn get_handle(entry_hash: EntryHashB64) -> ExternResult<Handle> {
    let element = get(EntryHash::from(entry_hash), GetOptions::default())?.ok_or(WasmError::Guest(String::from("Handle not found")))?;

    let handle: Handle = element.entry().to_app_option()?.ok_or(WasmError::Guest(String::from("Malformed handle")))?;

    Ok(handle)
}
/*
#[hdk_extern]
pub fn update_handle(new_handle_data: Handle, updated_entry: EntryHashB64) -> {

}*/