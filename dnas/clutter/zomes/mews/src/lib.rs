use hdk::prelude::holo_hash::*;
use hdk::prelude::*;

#[hdk_entry(id = "mew")]
pub struct Mew(String);

entry_defs![PathEntry::entry_def(), Mew::entry_def()];
const MEWS_PATH_SEGMENT: &str = "mews";
const FOLLOWERS_PATH_SEGMENT: &str = "followers";
const FOLLOWING_PATH_SEGMENT: &str = "following";
// const LICKS_PATH_SEGMENT: &str = "licks";
// const MENTIONS_PATH_SEGMENT: &str = "mentions";
// const IMAGES_PATH_SEGMENT: &str = "images";

fn get_my_mews_base(base_type: &str, ensure: bool) -> ExternResult<EntryHash> {
    let me: AgentPubKey = agent_info()?.agent_latest_pubkey;
    get_mews_base(me.into(), base_type, ensure)
}

fn get_mews_base(agent: AgentPubKeyB64, base_type: &str, ensure: bool) -> ExternResult<EntryHash> {
    let path = Path::from(format!("agent.{}.{}", agent, base_type));
    if ensure {
        path.ensure()?;
    }
    let anchor_hash = path.path_entry_hash()?;
    Ok(anchor_hash)
}

#[hdk_extern]
// TODO: we want a parsing function here to identify user references, tag references, etc to build posts, links, etc
pub fn create_mew(mew: Mew) -> ExternResult<HeaderHashB64> {
    let header_hash = create_entry(&mew)?;
    let hash = hash_entry(&mew)?;

    let base = get_my_mews_base(MEWS_PATH_SEGMENT, true)?;

    // TODO: maybe return the link_hh later if we need to delete
    let _link_hh = create_link(base, hash, LinkTag::new("mew"))?;
    Ok(header_hash.into())
}

// TODO: open question: do we want to allow edits, "deletes"?

#[hdk_extern]
pub fn get_mew(header_hash: HeaderHashB64) -> ExternResult<Mew> {
    let element = get(HeaderHash::from(header_hash), GetOptions::default())?
        .ok_or(WasmError::Guest(String::from("Mew not found")))?;

    let mew: Mew = element
        .entry()
        .to_app_option()?
        .ok_or(WasmError::Guest(String::from("Malformed mew")))?;

    Ok(mew)
}

#[derive(Debug, Serialize, Deserialize, SerializedBytes)]
#[serde(rename_all = "camelCase")]
pub struct FeedOptions {
    pub option: String,
}

#[derive(Debug, Serialize, Deserialize, SerializedBytes)]
#[serde(rename_all = "camelCase")]
pub struct FeedMew {
    pub entry: Mew,
    pub header: Header,
    pub id: HeaderHashB64,
}

#[hdk_extern]
pub fn mews_by(agent: AgentPubKeyB64) -> ExternResult<Vec<FeedMew>> {
    let base = get_mews_base(agent, MEWS_PATH_SEGMENT, false)?;
    let links = get_links(base, None)?;
    let get_input = links
        .into_iter()
        .map(|link| GetInput::new(link.target.into(), GetOptions::default()))
        .collect();

    let mew_elements = HDK.with(|hdk| hdk.borrow().get(get_input))?;

    let feed: Vec<FeedMew> = mew_elements
        .into_iter()
        .filter_map(|me| me)
        .filter_map(|element| match element.entry().to_app_option() {
            Ok(Some(g)) => Some(FeedMew {
                entry: g,
                header: element.header().clone(),
                id: element.header_address().clone().into(),
            }),
            _ => None,
        })
        .collect();
    Ok(feed)
}

#[hdk_extern]
pub fn mews_feed(_options: FeedOptions) -> ExternResult<Vec<FeedMew>> {
    let mut feed = Vec::new();
    for agent in my_following(())?.into_iter() {
        feed.append(&mut mews_by(agent)?);
    }
    // TODO don't really need to sort, could merge for efficiency
    feed.sort_by(|a, b| a.header.timestamp().cmp(&b.header.timestamp()));

    Ok(feed)
}

#[hdk_extern]
pub fn follow(agent: AgentPubKeyB64) -> ExternResult<()> {
    let me_target: EntryHash = agent_info()?.agent_latest_pubkey.into();
    let them_target: EntryHash = AgentPubKey::from(agent.clone()).into();

    let me = get_my_mews_base(FOLLOWING_PATH_SEGMENT, true)?;
    let _link_hh = create_link(me, them_target, ())?;

    let them = get_mews_base(agent, FOLLOWERS_PATH_SEGMENT, true)?;
    let _link_hh = create_link(them, me_target, ())?;
    Ok(())
}

#[hdk_extern]
pub fn my_following(_: ()) -> ExternResult<Vec<AgentPubKeyB64>> {
    let me: AgentPubKeyB64 = agent_info()?.agent_latest_pubkey.into();
    follow_inner(me, FOLLOWING_PATH_SEGMENT)
}
#[hdk_extern]
pub fn my_followers(_: ()) -> ExternResult<Vec<AgentPubKeyB64>> {
    let me: AgentPubKeyB64 = agent_info()?.agent_latest_pubkey.into();
    follow_inner(me, FOLLOWERS_PATH_SEGMENT)
}

fn follow_inner(agent: AgentPubKeyB64, base_type: &str) -> ExternResult<Vec<AgentPubKeyB64>> {
    let base = get_mews_base(agent, base_type, false)?;
    let links = get_links(base, None)?;
    Ok(links
        .into_iter()
        .map(|link| AgentPubKey::from(link.target).into())
        .collect())
}

// get who's following an agent
#[hdk_extern]
pub fn following(agent: AgentPubKeyB64) -> ExternResult<Vec<AgentPubKeyB64>> {
    follow_inner(agent, FOLLOWING_PATH_SEGMENT)
}

/// get whos followers are of an agent
#[hdk_extern]
pub fn followers(agent: AgentPubKeyB64) -> ExternResult<Vec<AgentPubKeyB64>> {
    follow_inner(agent, FOLLOWERS_PATH_SEGMENT)
}
