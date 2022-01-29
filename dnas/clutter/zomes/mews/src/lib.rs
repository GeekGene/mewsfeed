use hdk::prelude::*;
use hdk::prelude::holo_hash::*;

#[hdk_entry(id = "mew")]
pub struct Mew(String);

entry_defs![
    PathEntry::entry_def(),
    Mew::entry_def()
];

fn get_mews_base(agent: AgentPubKeyB64) -> ExternResult<EntryHash> {
    let path = Path::from(format!("agent.{}", agent));
    path.ensure()?;
    let anchor_hash = path.path_entry_hash()?;
    Ok(anchor_hash)
}

#[hdk_extern]
// TODO: we want a parsing function here to identify user references, tag references, etc to build posts, links, etc
pub fn create_mew(mew: Mew) -> ExternResult<HeaderHashB64> {
    let header_hash = create_entry(&mew)?;
    let hash = hash_entry(&mew)?;

    let me : AgentPubKeyB64 =  agent_info()?.agent_latest_pubkey.into();
    let base = get_mews_base(me)?;

    // TODO: maybe return the link_hh later if we need to delete
    let _link_hh = create_link(base, hash, LinkTag::new("mew"))?;
    Ok(header_hash.into())
}

// TODO: open question: do we want to allow edits, "deletes"?

#[hdk_extern]
pub fn get_mew(header_hash: HeaderHashB64) -> ExternResult<Mew> {
    let element = get(HeaderHash::from(header_hash), GetOptions::default())?.ok_or(WasmError::Guest(String::from("Mew not found")))?;

    let mew: Mew = element.entry().to_app_option()?.ok_or(WasmError::Guest(String::from("Malformed mew")))?;

    Ok(mew)
}

#[derive(Debug, Serialize, Deserialize, SerializedBytes)]
#[serde(rename_all = "camelCase")]
pub struct FeedOptions {
    pub option: String
}

#[derive(Debug, Serialize, Deserialize, SerializedBytes)]
#[serde(rename_all = "camelCase")]
pub struct FeedMew {
    pub entry: Mew,
    pub header: Header,
}

#[hdk_extern]
pub fn mews_by(agent: AgentPubKeyB64) -> ExternResult<Vec<FeedMew>> {
    let base = get_mews_base(agent)?;
    let links = get_links(base, Some(LinkTag::new("mew")))?;
    let get_input = links
        .into_iter()
        .map(|link| GetInput::new(link.target.into(), GetOptions::default()))
        .collect();

    let mew_elements = HDK.with(|hdk| hdk.borrow().get(get_input))?;

    let feed: Vec<FeedMew> = mew_elements
        .into_iter()
        .filter_map(|me| me)
        .filter_map(|element| match element.entry().to_app_option() {
            Ok(Some(g)) => Some(FeedMew{entry: g, header: element.header().clone()}),
            _ => None,
        })
        .collect();
    Ok(feed)
}

#[hdk_extern]
pub fn mews_feed(_options: FeedOptions) -> ExternResult<Vec<FeedMew>> {

    // TODO: temporarliy just return my own mews as my feed
    let me : AgentPubKeyB64 =  agent_info()?.agent_latest_pubkey.into();
    mews_by(me)
}