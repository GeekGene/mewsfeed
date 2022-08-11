use hdk::prelude::holo_hash::*;
use hdk::prelude::*;
use regex::Regex;

#[hdk_entry_defs]
#[unit_enum(UnitEntryTypes)]
enum EntryTypes {
    MewContent(MewContent),
    Mew(Mew),
}

#[hdk_entry_helper]
#[serde(rename_all = "camelCase")]
enum MewType {
    Original,
    Reply(ActionHash),
    Quote(ActionHash),
    MewMew(ActionHash),
}

#[hdk_entry_helper]
#[serde(rename_all = "camelCase")]
struct MewContent {
    text: String, // "Visit this web site ^link by @user about #hashtag to earn $cashtag! Also read this humm earth post ^link (as an HRL link)"
                  // mew_links: Vec<LinkTypes>, // [^links in the mewstring in sequence]
                  // mew_images: Vec<EntryHash>, //Vec of image links hashes to retrieve
}

#[hdk_entry_helper]
#[serde(rename_all = "camelCase")]
pub struct Mew {
    mew_type: MewType,
    content: Option<MewContent>,
}

#[hdk_entry_helper]
#[serde(rename_all = "camelCase")]
pub struct FeedOptions {
    pub option: String,
}

#[hdk_entry_helper]
#[serde(rename_all = "camelCase")]
pub struct FeedMew {
    pub mew: Mew,
    pub action: Action,
    pub action_hash: ActionHash,
    pub replies: Vec<AnyLinkableHash>,
    pub quotes: Vec<AnyLinkableHash>,
    pub licks: Vec<AgentPubKey>,
    pub mewmews: Vec<AnyLinkableHash>,
}

#[hdk_link_types]
enum LinkTypes {
    Link,
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

fn get_mews_base(agent: AgentPubKey, base_type: &str, _ensure: bool) -> ExternResult<EntryHash> {
    let path = Path::from(format!("agent.{}.{}", agent, base_type));
    // if ensure {
    //     path.ensure()?;
    // }
    let anchor_hash = path.path_entry_hash()?;
    Ok(anchor_hash)
}

// *** Creating mews ***

#[derive(Debug, Serialize, Deserialize, SerializedBytes)]
#[serde(rename_all = "camelCase")]
pub struct CreateMewInput {
    mew_type: MewType,
    text: Option<String>,
}

#[hdk_extern]
pub fn create_mew(mew: CreateMewInput) -> ExternResult<ActionHash> {
    let mew_action_hash = match mew.mew_type {
        MewType::Original => match mew.text {
            Some(mew_string) => create_original_mew(mew_string)?,
            None => {
                return Err(wasm_error!(WasmErrorInner::Guest(
                    "mew must contain text".to_string()
                )))
            }
        },
        MewType::Reply(original_action_hash) => match mew.text {
            Some(mew_string) => create_reply(mew_string, original_action_hash)?,
            None => {
                return Err(wasm_error!(WasmErrorInner::Guest(
                    "reply mew must contain text".to_string()
                )))
            }
        },
        MewType::MewMew(original_action_hash) => match mew.text {
            Some(_) => {
                return Err(wasm_error!(WasmErrorInner::Guest(
                    "mewmew must not contain text".to_string()
                )))
            }
            None => create_mewmew(original_action_hash)?,
        },
        MewType::Quote(original_entry_hash) => match mew.text {
            Some(mew_string) => create_quote(mew_string, original_entry_hash)?,
            None => {
                return Err(wasm_error!(WasmErrorInner::Guest(
                    "quote must contain text".to_string()
                )))
            }
        },
    };
    Ok(mew_action_hash)
}

pub fn create_original_mew(text: String) -> ExternResult<ActionHash> {
    let content = MewContent { text: text.clone() };
    // let _action_hash = create_entry(&content)?;

    let mew = Mew {
        mew_type: MewType::Original,
        content: Some(content),
    };
    let mew_action_hash = create_entry(EntryTypes::Mew(mew))?;

    let base = get_my_mews_base(MEWS_PATH_SEGMENT, true)?;

    let _link_ah = create_link(base, mew_action_hash.clone(), LinkTypes::Link, ())?;
    parse_mew_text(text, mew_action_hash.clone())?;
    Ok(mew_action_hash)
}

pub fn create_reply(text: String, original_action_hash: ActionHash) -> ExternResult<ActionHash> {
    let content = MewContent { text: text.clone() };
    // let _action_hash = create_entry(&content)?;

    let mew = Mew {
        mew_type: MewType::Reply(original_action_hash.clone().into()),
        content: Some(content),
    };
    let reply_action_hash = create_entry(EntryTypes::Mew(mew))?;

    let base = get_my_mews_base(MEWS_PATH_SEGMENT, true)?;

    let _link_ah = create_link(base, reply_action_hash.clone(), LinkTypes::Link, ())?;
    // link off original entry as reply
    let _reply_link_ah = create_link(
        original_action_hash.clone(),
        reply_action_hash.clone(),
        LinkTypes::Link,
        LinkTag::new(REPLY_PATH_SEGMENT),
    )?;
    parse_mew_text(text, reply_action_hash.clone())?;
    Ok(reply_action_hash)
}

pub fn create_mewmew(original_action_hash: ActionHash) -> ExternResult<ActionHash> {
    let mew = Mew {
        mew_type: MewType::MewMew(original_action_hash.clone().into()),
        content: None,
    };
    let mewmew_action_hash = create_entry(EntryTypes::Mew(mew))?;

    let base = get_my_mews_base(MEWS_PATH_SEGMENT, true)?;

    let _link_ah = create_link(base, mewmew_action_hash.clone(), LinkTypes::Link, ())?;
    // link off original entry as mewmew
    let _quote_link_ah = create_link(
        original_action_hash.clone(),
        mewmew_action_hash.clone(),
        LinkTypes::Link,
        LinkTag::new(MEWMEW_PATH_SEGMENT),
    )?;
    Ok(mewmew_action_hash)
}

pub fn create_quote(text: String, original_action_hash: ActionHash) -> ExternResult<ActionHash> {
    let content = MewContent { text: text.clone() };
    let mew = Mew {
        mew_type: MewType::Quote(original_action_hash.clone()),
        content: Some(content),
    };
    let quote_action_hash = create_entry(EntryTypes::Mew(mew))?;

    let base = get_my_mews_base(MEWS_PATH_SEGMENT, true)?;

    let _link_ah = create_link(base, quote_action_hash.clone(), LinkTypes::Link, ())?;
    // link off original entry as quote
    let _quote_link_ah = create_link(
        original_action_hash.clone(),
        quote_action_hash.clone(),
        LinkTypes::Link,
        LinkTag::new(QUOTE_PATH_SEGMENT),
    )?;
    parse_mew_text(text, quote_action_hash.clone())?;
    Ok(quote_action_hash.into())
}

// *** Getting mews ***

#[hdk_extern]
pub fn get_mew(action_hash: ActionHash) -> ExternResult<Mew> {
    let element = get(action_hash, GetOptions::default())?.ok_or(wasm_error!(
        WasmErrorInner::Guest(String::from("Mew not found"))
    ))?;

    let mew: Mew =
        element
            .entry()
            .to_app_option()
            .unwrap()
            .ok_or(wasm_error!(WasmErrorInner::Guest(String::from(
                "Malformed mew"
            ))))?;

    Ok(mew)
}

#[hdk_extern]
pub fn get_feed_mew_and_context(action_hash: ActionHash) -> ExternResult<FeedMew> {
    let element = get(action_hash.clone(), GetOptions::default())?.ok_or(wasm_error!(
        WasmErrorInner::Guest(String::from("Mew not found"))
    ))?;
    let mew: Mew =
        element
            .entry()
            .to_app_option()
            .unwrap()
            .ok_or(wasm_error!(WasmErrorInner::Guest(String::from(
                "Malformed mew"
            ))))?;

    let lick_links = get_links(
        action_hash.clone(),
        LinkTypes::Link,
        Some(LinkTag::new(LICKS_PATH_SEGMENT)),
    )?;
    let licks: Vec<AgentPubKey> = lick_links
        .into_iter()
        .map(|link| AgentPubKey::from(EntryHash::from(link.target)).into())
        .collect();

    let reply_links = get_links(
        action_hash.clone(),
        LinkTypes::Link,
        Some(LinkTag::new(REPLY_PATH_SEGMENT)),
    )?;
    let replies: Vec<AnyLinkableHash> = reply_links
        .into_iter()
        .map(|link| link.target.into())
        .collect();

    let mewmew_links = get_links(
        action_hash.clone(),
        LinkTypes::Link,
        Some(LinkTag::new(MEWMEW_PATH_SEGMENT)),
    )?;
    let mewmews: Vec<AnyLinkableHash> = mewmew_links
        .into_iter()
        .map(|mewmew| mewmew.target.into())
        .collect();

    let quote_links = get_links(
        action_hash.clone(),
        LinkTypes::Link,
        Some(LinkTag::new(QUOTE_PATH_SEGMENT)),
    )?;
    let quotes: Vec<AnyLinkableHash> = quote_links
        .into_iter()
        .map(|link| link.target.into())
        .collect();

    let feed_mew_and_context = FeedMew {
        mew,
        action: element.action().clone(),
        action_hash: element.signed_action().as_hash().clone(),
        replies,
        quotes,
        licks,
        mewmews,
    };
    Ok(feed_mew_and_context)
}

// *** Mews feeds ***

#[hdk_extern]
pub fn mews_by(agent: AgentPubKey) -> ExternResult<Vec<FeedMew>> {
    let base = get_mews_base(agent, MEWS_PATH_SEGMENT, false)?;
    let links = get_links(base, LinkTypes::Link, None)?;

    let mut feed: Vec<FeedMew> = links
        .into_iter()
        .map(|link| get_feed_mew_and_context(ActionHash::from(link.target).into()))
        .filter_map(Result::ok)
        .collect();
    feed.sort_by(|a, b| b.action.timestamp().cmp(&a.action.timestamp()));

    Ok(feed)
}

#[hdk_extern]
pub fn mews_feed(_options: FeedOptions) -> ExternResult<Vec<FeedMew>> {
    let mut feed = Vec::new();
    let me = agent_info()?.agent_latest_pubkey;
    feed.append(&mut mews_by(me)?);
    for agent in my_following(())?.into_iter() {
        feed.append(&mut mews_by(agent)?);
    }
    // TODO don't really need to sort, could merge for efficiency
    // sort by timestamp in descending order
    feed.sort_by(|a, b| b.action.timestamp().cmp(&a.action.timestamp()));

    Ok(feed)
}

// *** Liking ***

#[hdk_extern]
pub fn lick_mew(action_hash: ActionHash) -> ExternResult<()> {
    let me: AgentPubKey = agent_info()?.agent_latest_pubkey;

    let base = get_my_mews_base(LICKS_PATH_SEGMENT, true)?;
    let _my_lick_ah = create_link(base, action_hash.clone(), LinkTypes::Link, ())?;
    let _mew_lick_ah = create_link(
        action_hash.clone(),
        me.clone(),
        LinkTypes::Link,
        LinkTag::new(LICKS_PATH_SEGMENT),
    )?;
    Ok(())
}

#[hdk_extern]
pub fn my_licks(_: ()) -> ExternResult<Vec<AnyLinkableHash>> {
    let me = agent_info()?.agent_latest_pubkey;
    licks_inner(me, LICKS_PATH_SEGMENT)
}

fn licks_inner(agent: AgentPubKey, base_type: &str) -> ExternResult<Vec<AnyLinkableHash>> {
    let base = get_mews_base(agent, base_type, false)?;
    let links = get_links(base, LinkTypes::Link, None)?;
    Ok(links.into_iter().map(|link| link.target).collect())
}

#[hdk_extern]
pub fn unlick_mew(action_hash: ActionHash) -> ExternResult<()> {
    let me: EntryHash = agent_info()?.agent_latest_pubkey.into();
    let mew_licks = get_links(action_hash.clone(), LinkTypes::Link, None)?;
    for lick in mew_licks {
        if lick.target == me.clone().into() {
            let _delete_link_ah = delete_link(lick.create_link_hash)?;
            break;
        }
    }

    let my_licks = get_my_mews_base(LICKS_PATH_SEGMENT, true)?;
    let links = get_links(my_licks.clone(), LinkTypes::Link, None)?;
    for link in links {
        if link.target == action_hash.clone().into() {
            let _deleted_link_ah = delete_link(link.create_link_hash)?;
            break;
        }
    }
    Ok(())
}

// get who's following an agent
#[hdk_extern]
pub fn licks(agent: AgentPubKey) -> ExternResult<Vec<AnyLinkableHash>> {
    licks_inner(agent, LICKS_PATH_SEGMENT)
}

// *** Following ***

#[hdk_extern]
pub fn follow(agent: AgentPubKey) -> ExternResult<()> {
    let me_target: EntryHash = agent_info()?.agent_latest_pubkey.into();
    let them_target: EntryHash = AgentPubKey::from(agent.clone()).into();

    if me_target == them_target {
        return Err(wasm_error!(WasmErrorInner::Guest(String::from(
            "Cannot follow yourself."
        ))));
    }

    let me = get_my_mews_base(FOLLOWING_PATH_SEGMENT, true)?;
    let _link_ah = create_link(me, them_target, LinkTypes::Link, ())?;

    let them = get_mews_base(agent, FOLLOWERS_PATH_SEGMENT, true)?;
    let _link_ah = create_link(them, me_target, LinkTypes::Link, ())?;
    Ok(())
}

#[hdk_extern]
pub fn unfollow(agent: AgentPubKey) -> ExternResult<()> {
    let them_target: EntryHash = AgentPubKey::from(agent.clone()).into();
    let me = get_my_mews_base(FOLLOWING_PATH_SEGMENT, true)?;
    let links = get_links(me.clone(), LinkTypes::Link, None)?;
    for link in links {
        if link.target == them_target.clone().into() {
            let _deleted_link_ah = delete_link(link.create_link_hash)?;
            break;
        }
    }

    let me_target: EntryHash = agent_info()?.agent_latest_pubkey.into();
    let them = get_mews_base(agent, FOLLOWERS_PATH_SEGMENT, true)?;
    let links = get_links(them.clone(), LinkTypes::Link, None)?;
    for link in links {
        if link.target == me_target.clone().into() {
            let _deleted_link_ah = delete_link(link.create_link_hash)?;
            break;
        }
    }

    Ok(())
}

#[hdk_extern]
pub fn my_following(_: ()) -> ExternResult<Vec<AgentPubKey>> {
    let me = agent_info()?.agent_latest_pubkey;
    follow_inner(me, FOLLOWING_PATH_SEGMENT)
}

#[hdk_extern]
pub fn my_followers(_: ()) -> ExternResult<Vec<AgentPubKey>> {
    let me = agent_info()?.agent_latest_pubkey;
    follow_inner(me, FOLLOWERS_PATH_SEGMENT)
}

// get who an agent is following
#[hdk_extern]
pub fn following(agent: AgentPubKey) -> ExternResult<Vec<AgentPubKey>> {
    follow_inner(agent, FOLLOWING_PATH_SEGMENT)
}

// get followers of an agent
#[hdk_extern]
pub fn followers(agent: AgentPubKey) -> ExternResult<Vec<AgentPubKey>> {
    follow_inner(agent, FOLLOWERS_PATH_SEGMENT)
}

fn follow_inner(agent: AgentPubKey, base_type: &str) -> ExternResult<Vec<AgentPubKey>> {
    let base = get_mews_base(agent, base_type, false)?;
    let links = get_links(base, LinkTypes::Link, None)?;
    Ok(links
        .into_iter()
        .map(|link| AgentPubKey::from(EntryHash::from(link.target)).into())
        .collect())
}

// *** Tagging (hashtag, cashtag, mention) ***

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

pub fn get_mews_from_path(path: Path) -> ExternResult<Vec<FeedMew>> {
    let path_hash = path.path_entry_hash()?;

    let links = get_links(path_hash, LinkTypes::Link, None)?;
    let mut mews: Vec<FeedMew> = links
        .into_iter()
        .map(|link| {
            get(ActionHash::from(link.target), GetOptions::default())
                .unwrap()
                .unwrap()
        })
        .map(|element| get_feed_mew_and_context(element.signed_action().as_hash().clone()).unwrap())
        .collect();
    mews.sort_by(|a, b| b.action.timestamp().cmp(&a.action.timestamp()));
    Ok(mews)
}

pub fn parse_mew_text(mew_text: String, mew_hash: ActionHash) -> ExternResult<()> {
    let hashtag_regex = Regex::new(r"#\w+").unwrap();
    let cashtag_regex = Regex::new(r"\$\w+").unwrap();
    let mention_regex = Regex::new(r"@\w+").unwrap();
    for mat in hashtag_regex.find_iter(&mew_text.clone()) {
        let hashtag = mat.as_str();
        let path = Path::from(format!("hashtags.{}", hashtag));
        // path.ensure()?;
        let path_hash = path.path_entry_hash()?;
        let _link_ah = create_link(path_hash, mew_hash.clone(), LinkTypes::Link, ())?;
    }
    for mat in cashtag_regex.find_iter(&mew_text.clone()) {
        let cashtag = mat.as_str();
        let path = Path::from(format!("cashtags.{}", cashtag));
        // path.ensure()?;
        let path_hash = path.path_entry_hash()?;
        let _link_ah = create_link(path_hash, mew_hash.clone(), LinkTypes::Link, ())?;
    }
    for mat in mention_regex.find_iter(&mew_text.clone()) {
        let mention = mat.as_str();
        let path = Path::from(format!("mentions.{}", mention));
        // path.ensure()?;
        let path_hash = path.path_entry_hash()?;
        let _link_ah = create_link(path_hash, mew_hash.clone(), LinkTypes::Link, ())?;
    }
    Ok(())
}
