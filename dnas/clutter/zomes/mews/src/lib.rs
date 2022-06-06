use hdk::prelude::holo_hash::*;
use hdk::prelude::*;
use regex::Regex;

entry_defs![
    PathEntry::entry_def(),
    MewContent::entry_def(),
    Mew::entry_def()
];

#[derive(Debug, Serialize, Deserialize, SerializedBytes)]
#[serde(rename_all = "camelCase")]
enum MewType {
    Original,
    Reply(EntryHashB64),
    Quote(EntryHashB64),
    MewMew(EntryHashB64),
}

#[hdk_entry(id = "mew_content")]
#[serde(rename_all = "camelCase")]
struct MewContent {
    text: String, // "Visit this web site ^link by @user about #hashtag to earn $cashtag! Also read this humm earth post ^link (as an HRL link)"
                  // mew_links: Vec<LinkTypes>, // [^links in the mewstring in sequence]
                  // mew_images: Vec<EntryHash>, //Vec of image links hashes to retrieve
}
#[hdk_entry(id = "full_mew")]
#[serde(rename_all = "camelCase")]
pub struct Mew {
    mew_type: MewType,
    content: Option<MewContent>,
}

#[derive(Debug, Serialize, Deserialize, SerializedBytes)]
#[serde(rename_all = "camelCase")]
pub struct FeedOptions {
    pub option: String,
}

#[derive(Debug, Serialize, Deserialize, SerializedBytes)]
#[serde(rename_all = "camelCase")]
pub struct FeedMew {
    pub mew: Mew,
    pub header: Header,
    pub mew_entry_hash: EntryHashB64,
    pub replies: Vec<AnyLinkableHashB64>,
    pub quotes: Vec<AnyLinkableHashB64>,
    pub licks: Vec<AgentPubKeyB64>,
    pub mewmews: Vec<AnyLinkableHashB64>,
}

const MEWS_PATH_SEGMENT: &str = "mews";
const FOLLOWERS_PATH_SEGMENT: &str = "followers";
const FOLLOWING_PATH_SEGMENT: &str = "following";
const LICKS_PATH_SEGMENT: &str = "licks";
const REPLY_PATH_SEGMENT: &str = "replies";
const MEWMEW_PATH_SEGMENT: &str = "mewmew";
const QUOTE_PATH_SEGMENT: &str = "quotes";

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

#[derive(Debug, Serialize, Deserialize, SerializedBytes)]
#[serde(rename_all = "camelCase")]
pub struct CreateMewInput {
    mew_type: MewType,
    text: Option<String>,
}

#[hdk_extern]
// TODO: we want a parsing function here to identify user references, tag references, etc to build posts, links, etc
pub fn create_mew(mew: CreateMewInput) -> ExternResult<HeaderHashB64> {
    // TODO: enforce mew type is correct
    // check the type
    let mew_header_hash = match mew.mew_type {
        MewType::Original => match mew.text {
            Some(mew_string) => create_original_mew(mew_string)?,
            None => return Err(WasmError::Guest(String::from("mew must contain text"))),
        },
        MewType::Reply(original_entry_hash) => match mew.text {
            Some(mew_string) => create_reply_mew(mew_string, original_entry_hash)?,
            None => {
                return Err(WasmError::Guest(String::from(
                    "reply mew must contain text",
                )))
            }
        },
        MewType::MewMew(original_entry_hash) => match mew.text {
            Some(_) => {
                return Err(WasmError::Guest(String::from(
                    "mewmew cannot contain text. Try quoting.",
                )))
            }
            None => create_mewmew(original_entry_hash)?,
        },
        MewType::Quote(original_entry_hash) => match mew.text {
            Some(mew_string) => create_quote(mew_string, original_entry_hash)?,
            None => return Err(WasmError::Guest(String::from("quote must contain text"))),
        },
    };
    Ok(mew_header_hash)
}

pub fn create_original_mew(text: String) -> ExternResult<HeaderHashB64> {
    let content = MewContent { text: text.clone() };
    let _header_hash = create_entry(&content)?;

    let mew = Mew {
        mew_type: MewType::Original,
        content: Some(content),
    };
    let mew_header_hash = create_entry(&mew)?;
    let hash = hash_entry(&mew)?;

    let base = get_my_mews_base(MEWS_PATH_SEGMENT, true)?;

    // TODO: maybe return the link_hh later if we need to delete
    let _link_hh = create_link(base, hash.clone(), HdkLinkType::Any, ())?;
    parse_mew_text(text, hash)?;
    Ok(mew_header_hash.into())
}

pub fn create_reply_mew(
    text: String,
    original_entry_hash: EntryHashB64,
) -> ExternResult<HeaderHashB64> {
    let content = MewContent { text: text.clone() };
    let _header_hash = create_entry(&content)?;

    let mew = Mew {
        mew_type: MewType::Reply(original_entry_hash.clone().into()),
        content: Some(content),
    };
    let mew_header_hash = create_entry(&mew)?;
    let hash = hash_entry(&mew)?;

    let base = get_my_mews_base(MEWS_PATH_SEGMENT, true)?;

    // TODO: maybe return the link_hh later if we need to delete
    let _link_hh = create_link(base, hash.clone(), HdkLinkType::Any, ())?;
    // link off original entry as reply
    let _reply_link_hh = create_link::<EntryHash, EntryHash, HdkLinkType, LinkTag>(
        original_entry_hash.into(),
        hash.clone(),
        HdkLinkType::Any,
        LinkTag::new(REPLY_PATH_SEGMENT),
    )?;
    parse_mew_text(text, hash)?;
    Ok(mew_header_hash.into())
}

pub fn create_mewmew(original_entry_hash: EntryHashB64) -> ExternResult<HeaderHashB64> {
    let mew = Mew {
        mew_type: MewType::MewMew(original_entry_hash.clone().into()),
        content: None,
    };
    let mew_header_hash = create_entry(&mew)?;
    let hash = hash_entry(&mew)?;

    let base = get_my_mews_base(MEWS_PATH_SEGMENT, true)?;

    // TODO: maybe return the link_hh later if we need to delete
    let _link_hh = create_link(base, hash.clone(), HdkLinkType::Any, ())?;
    // link off original entry as mewmew
    let _quote_link_hh = create_link::<EntryHash, EntryHash, HdkLinkType, LinkTag>(
        original_entry_hash.into(),
        hash.clone(),
        HdkLinkType::Any,
        LinkTag::new(MEWMEW_PATH_SEGMENT),
    )?;
    Ok(mew_header_hash.into())
}

pub fn create_quote(
    text: String,
    original_entry_hash: EntryHashB64,
) -> ExternResult<HeaderHashB64> {
    let content = MewContent { text: text.clone() };
    let _header_hash = create_entry(&content)?;

    let mew = Mew {
        mew_type: MewType::Quote(original_entry_hash.clone().into()),
        content: Some(content),
    };
    let mew_header_hash = create_entry(&mew)?;
    let hash = hash_entry(&mew)?;

    let base = get_my_mews_base(MEWS_PATH_SEGMENT, true)?;

    // TODO: maybe return the link_hh later if we need to delete
    let _link_hh = create_link(base, hash.clone(), HdkLinkType::Any, ())?;
    // link off original entry as quot
    let _mewmew_link_hh = create_link::<EntryHash, EntryHash, HdkLinkType, LinkTag>(
        original_entry_hash.into(),
        hash.clone(),
        HdkLinkType::Any,
        LinkTag::new(QUOTE_PATH_SEGMENT),
    )?;
    parse_mew_text(text, hash)?;
    Ok(mew_header_hash.into())
}

#[hdk_extern]
pub fn lick_mew(entry_hash: EntryHashB64) -> ExternResult<()> {
    let me: AgentPubKey = agent_info()?.agent_latest_pubkey;

    let base = get_my_mews_base(LICKS_PATH_SEGMENT, true)?;
    let _my_lick_hh = create_link::<EntryHash, EntryHash, HdkLinkType, ()>(
        base,
        entry_hash.clone().into(),
        HdkLinkType::Any,
        (),
    )?;
    let _mew_lick_hh = create_link::<EntryHash, EntryHash, HdkLinkType, LinkTag>(
        entry_hash.into(),
        me.into(),
        HdkLinkType::Any,
        LinkTag::new(LICKS_PATH_SEGMENT),
    )?;
    Ok(())
}

#[hdk_extern]
pub fn my_licks(_: ()) -> ExternResult<Vec<AnyLinkableHashB64>> {
    let me: AgentPubKeyB64 = agent_info()?.agent_latest_pubkey.into();
    licks_inner(me, LICKS_PATH_SEGMENT)
}

fn licks_inner(agent: AgentPubKeyB64, base_type: &str) -> ExternResult<Vec<AnyLinkableHashB64>> {
    let base = get_mews_base(agent, base_type, false)?;
    let links = get_links(base, None)?;
    Ok(links.into_iter().map(|link| link.target.into()).collect())
}

#[hdk_extern]
pub fn unlick_mew(entry_hash_b64: EntryHashB64) -> ExternResult<()> {
    let entry_hash: EntryHash = entry_hash_b64.into();
    let me: EntryHash = agent_info()?.agent_latest_pubkey.into();
    let mew_licks = get_links(entry_hash.clone(), None)?;
    for lick in mew_licks {
        if lick.target == me.clone().into() {
            let _delete_link_hh = delete_link(lick.create_link_hash)?;
            break;
        }
    }

    let my_licks = get_my_mews_base(LICKS_PATH_SEGMENT, true)?;
    let links = get_links(my_licks.clone(), None)?;
    for link in links {
        if link.target == entry_hash.clone().into() {
            let _deleted_link_hh = delete_link(link.create_link_hash)?;
            break;
        }
    }
    Ok(())
}

// get who's following an agent
#[hdk_extern]
pub fn licks(agent: AgentPubKeyB64) -> ExternResult<Vec<AnyLinkableHashB64>> {
    licks_inner(agent, LICKS_PATH_SEGMENT)
}

#[hdk_extern]
pub fn get_mew(hash: String) -> ExternResult<Mew> {
    let header_hash_result = HeaderHashB64::from_b64_str(&hash.clone());
    let entry_hash_result = EntryHashB64::from_b64_str(&hash);

    match header_hash_result {
        Ok(header_hash) => Ok(get_mew_inner(HeaderHash::from(header_hash))?),
        Err(_) => match entry_hash_result {
            Ok(entry_hash) => Ok(get_mew_inner(EntryHash::from(entry_hash))?),
            Err(_) => return Err(WasmError::Guest(String::from("invalid hash format"))),
        },
    }
}

pub fn get_mew_inner<H>(hash: H) -> ExternResult<Mew>
where
    AnyDhtHash: From<H>,
{
    let element =
        get(hash, GetOptions::default())?.ok_or(WasmError::Guest(String::from("Mew not found")))?;

    let mew: Mew = element
        .entry()
        .to_app_option()?
        .ok_or(WasmError::Guest(String::from("Malformed mew")))?;

    Ok(mew)
}

#[hdk_extern]
pub fn get_feed_mew_and_context(hash: String) -> ExternResult<FeedMew> {
    let header_hash_result = HeaderHashB64::from_b64_str(&hash.clone());
    let entry_hash_result = EntryHashB64::from_b64_str(&hash);

    match header_hash_result {
        Ok(header_hash) => Ok(get_feed_mew_and_context_inner(HeaderHash::from(
            header_hash,
        ))?),
        Err(_) => match entry_hash_result {
            Ok(entry_hash) => Ok(get_feed_mew_and_context_inner(EntryHash::from(entry_hash))?),
            Err(_) => return Err(WasmError::Guest(String::from("invalid hash format"))),
        },
    }
}

pub fn get_feed_mew_and_context_inner<H>(hash: H) -> ExternResult<FeedMew>
where
    AnyDhtHash: From<H>,
{
    let element =
        get(hash, GetOptions::default())?.ok_or(WasmError::Guest(String::from("Mew not found")))?;
    let mew: Mew = element
        .entry()
        .to_app_option()?
        .ok_or(WasmError::Guest(String::from("Malformed mew")))?;
    // get vecs
    let quote_links = get_links(
        element
            .header()
            .entry_hash()
            .ok_or(WasmError::Guest(String::from(
                "no entry found for header hash",
            )))?
            .clone(),
        Some(LinkTag::new(QUOTE_PATH_SEGMENT)),
    )?;
    let quotes: Vec<AnyLinkableHashB64> = quote_links
        .into_iter()
        .map(|link| link.target.into())
        .collect();
    let reply_links = get_links(
        element
            .header()
            .entry_hash()
            .ok_or(WasmError::Guest(String::from(
                "no entry found for header hash",
            )))?
            .clone(),
        Some(LinkTag::new(REPLY_PATH_SEGMENT)),
    )?;
    let replies: Vec<AnyLinkableHashB64> = reply_links
        .into_iter()
        .map(|link| link.target.into())
        .collect();
    let lick_links = get_links(
        element
            .header()
            .entry_hash()
            .ok_or(WasmError::Guest(String::from(
                "no entry found for header hash",
            )))?
            .clone(),
        Some(LinkTag::new(LICKS_PATH_SEGMENT)),
    )?;
    let licks: Vec<AgentPubKeyB64> = lick_links
        .into_iter()
        .map(|link| AgentPubKey::from(EntryHash::from(link.target)).into())
        .collect();
    let mewmew_links = get_links(
        element
            .header()
            .entry_hash()
            .ok_or(WasmError::Guest(String::from(
                "no entry found for header hash",
            )))?
            .clone(),
        Some(LinkTag::new(MEWMEW_PATH_SEGMENT)),
    )?;
    let mewmews: Vec<AnyLinkableHashB64> = mewmew_links
        .into_iter()
        .map(|mewmew| mewmew.target.into())
        .collect();

    let feed_mew_and_context = FeedMew {
        mew,
        header: element.header().clone(),
        mew_entry_hash: EntryHash::from(
            element
                .header()
                .entry_hash()
                .ok_or(WasmError::Guest(String::from(
                    "could not stringify entry hash",
                )))?
                .clone(),
        )
        .into(),
        replies,
        quotes,
        licks,
        mewmews,
    };
    Ok(feed_mew_and_context)
}

#[hdk_extern]
pub fn mews_by(agent: AgentPubKeyB64) -> ExternResult<Vec<FeedMew>> {
    let base = get_mews_base(agent, MEWS_PATH_SEGMENT, false)?;
    let links = get_links(base, None)?;

    let mut feed: Vec<FeedMew> = links
        .into_iter()
        .map(|link| get_feed_mew_and_context_inner(link.target))
        .filter_map(Result::ok)
        .collect();
    feed.sort_by(|a, b| b.header.timestamp().cmp(&a.header.timestamp()));

    Ok(feed)
}

#[hdk_extern]
pub fn mews_feed(_options: FeedOptions) -> ExternResult<Vec<FeedMew>> {
    let mut feed = Vec::new();
    let me = agent_info()?.agent_latest_pubkey;
    feed.append(&mut mews_by(AgentPubKeyB64::from(me))?);
    for agent in my_following(())?.into_iter() {
        feed.append(&mut mews_by(agent)?);
    }
    // TODO don't really need to sort, could merge for efficiency
    // sort by timestamp in descending order
    feed.sort_by(|a, b| b.header.timestamp().cmp(&a.header.timestamp()));

    Ok(feed)
}

#[hdk_extern]
pub fn follow(agent: AgentPubKeyB64) -> ExternResult<()> {
    let me_target: EntryHash = agent_info()?.agent_latest_pubkey.into();
    let them_target: EntryHash = AgentPubKey::from(agent.clone()).into();

    if me_target == them_target {
        return Err(WasmError::Guest(String::from("Cannot follow yourself.")));
    }

    let me = get_my_mews_base(FOLLOWING_PATH_SEGMENT, true)?;
    let _link_hh = create_link(me, them_target, HdkLinkType::Any, ())?;

    let them = get_mews_base(agent, FOLLOWERS_PATH_SEGMENT, true)?;
    let _link_hh = create_link(them, me_target, HdkLinkType::Any, ())?;
    Ok(())
}

#[hdk_extern]
pub fn unfollow(agent: AgentPubKeyB64) -> ExternResult<()> {
    let them_target: EntryHash = AgentPubKey::from(agent.clone()).into();
    let me = get_my_mews_base(FOLLOWING_PATH_SEGMENT, true)?;
    let links = get_links(me.clone(), None)?;
    for link in links {
        if link.target == them_target.clone().into() {
            let _deleted_link_hh = delete_link(link.create_link_hash)?;
            break;
        }
    }

    let me_target: EntryHash = agent_info()?.agent_latest_pubkey.into();
    let them = get_mews_base(agent, FOLLOWERS_PATH_SEGMENT, true)?;
    let links = get_links(them.clone(), None)?;
    for link in links {
        if link.target == me_target.clone().into() {
            let _deleted_link_hh = delete_link(link.create_link_hash)?;
            break;
        }
    }

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
        .map(|link| AgentPubKey::from(EntryHash::from(link.target)).into())
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

pub fn get_mews_from_path(path: Path) -> ExternResult<Vec<FeedMew>> {
    let path_hash = path.path_entry_hash()?;

    let links = get_links(path_hash, None)?;
    let get_input = links
        .into_iter()
        .map(|link| GetInput::new(link.target.into(), GetOptions::default()))
        .collect();

    let mew_elements = HDK.with(|hdk| hdk.borrow().get(get_input))?;

    let hashtag_feed: Vec<FeedMew> = mew_elements
        .into_iter()
        .filter_map(|me| me)
        .filter_map(|element| {
            Some(get_feed_mew_and_context(element.header().entry_hash()?.to_string()).unwrap())
        })
        .collect();
    Ok(hashtag_feed)
}

#[hdk_extern]
pub fn get_mews_with_hashtag(hashtag: String) -> ExternResult<Vec<FeedMew>> {
    let path = Path::from(format!("hashtags.{}", hashtag));
    Ok(get_mews_from_path(path)?)
}

#[hdk_extern]
pub fn get_mews_with_cashtag(hashtag: String) -> ExternResult<Vec<FeedMew>> {
    let path = Path::from(format!("cashtags.{}", hashtag));
    Ok(get_mews_from_path(path)?)
}

#[hdk_extern]
pub fn get_mews_with_mention(hashtag: String) -> ExternResult<Vec<FeedMew>> {
    let path = Path::from(format!("mentions.{}", hashtag));
    Ok(get_mews_from_path(path)?)
}

pub fn parse_mew_text(mew_text: String, mew_hash: EntryHash) -> ExternResult<()> {
    let hashtag_regex = Regex::new(r"#\w+").unwrap();
    let cashtag_regex = Regex::new(r"\$\w+").unwrap();
    let mention_regex = Regex::new(r"@\w+").unwrap();
    for mat in hashtag_regex.find_iter(&mew_text.clone()) {
        let hashtag = mat.as_str();
        let path = Path::from(format!("hashtags.{}", hashtag));
        path.ensure()?;
        let path_hash = path.path_entry_hash()?;
        let _link_hh = create_link(path_hash, mew_hash.clone(), HdkLinkType::Any, ())?;
    }
    for mat in cashtag_regex.find_iter(&mew_text.clone()) {
        let cashtag = mat.as_str();
        let path = Path::from(format!("cashtags.{}", cashtag));
        path.ensure()?;
        let path_hash = path.path_entry_hash()?;
        let _link_hh = create_link(path_hash, mew_hash.clone(), HdkLinkType::Any, ())?;
    }
    for mat in mention_regex.find_iter(&mew_text.clone()) {
        let mention = mat.as_str();
        let path = Path::from(format!("mentions.{}", mention));
        path.ensure()?;
        let path_hash = path.path_entry_hash()?;
        let _link_hh = create_link(path_hash, mew_hash.clone(), HdkLinkType::Any, ())?;
    }
    Ok(())
}
