use hdk::prelude::*;
use hdk::prelude::holo_hash::*;

#[hdk_entry(id = "file")]
pub struct Post(String);

// TODO: replace "post" with file everywhere
// TODO: identify the mime types for different file types so it can render it – starting first with images only 
// TODO: need to define FilestoreImage somewhere in here

entry_defs![
    Post::entry_def()
];

#[hdk_extern]
pub fn create_post(post: Post) -> ExternResult<EntryHashB64> {
    create_entry(&post)?;
    let hash = hash_entry(&post)?;

    Ok(EntryHashB64::from(hash))
}

#[hdk_extern]
pub fn get_post(entry_hash: EntryHashB64) -> ExternResult<Post> {
    let element = get(EntryHash::from(entry_hash), GetOptions::default())?.ok_or(WasmError::Guest(String::from("Post not found")))?;

    let post: Post = element.entry().to_app_option()?.ok_or(WasmError::Guest(String::from("Malformed post")))?;

    Ok(post)
}
