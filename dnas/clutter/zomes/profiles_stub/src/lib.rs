use hdk::prelude::*;
use hdk::prelude::holo_hash::*;

#[hdk_entry(id = "handle")]
// define depth stuff here for the Handle(Path)? https://docs.rs/hdk/0.0.116/hdk/hash_path/shard/index.html
pub struct Handle(Path);

#[hdk_entry(id = "profile")]
// TODO: decide on pub
pub struct Profile {
    // TODO: define image type later in conjunction with the filestore zome
    avatar: FilestoreImage,
    location: String,
    bio: String,
};

entry_defs![
    // Clutter handle for user
    Handle::entry_def()
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
