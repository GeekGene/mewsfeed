use hdk::{prelude::*, hash_path::path::Component};
use mews_integrity::*;
use hc_time_index::*;
use regex::Regex;
use chrono::{NaiveDateTime, DateTime, Duration, Utc, Datelike};
use strum::IntoEnumIterator;
use hc_lib_ranking_index::RankingIndex;

mod time_index;
use time_index::*;

mod traits;
use traits::*;

mod utils;
use utils::*;

#[hdk_extern]
fn init(_: ()) -> ExternResult<InitCallbackResult> {
    let _index = get_current_index(
        TIME_INDEX_NAME.into(), 
        None,
        TIME_INDEX_PATH_LINK_TYPE
    );

    schedule("scheduled_check_publish_rankings")?;
    
    Ok(InitCallbackResult::Pass)
}

fn get_my_mews_base(base_type: &str, ensure: bool) -> ExternResult<EntryHash> {
    let me: AgentPubKey = agent_info()?.agent_latest_pubkey;
    get_mews_base(me.into(), base_type, ensure)
}

fn get_mews_base(agent: AgentPubKey, base_type: &str, _ensure: bool) -> ExternResult<EntryHash> {
    let path = Path::from(format!("agent.{}.{}", agent, base_type));
    let anchor_hash = path.path_entry_hash()?;
    Ok(anchor_hash)
}

// *** Creating mews ***
#[hdk_extern]
pub fn create_mew(mew: CreateMewInput) -> ExternResult<ActionHash> {
    let mew_action_hash = match mew.mew_type {
        MewType::Original => match mew.text {
            Some(mew_string) => create_original_mew(MewContent {
                text: mew_string,
                links: mew.links,
            })?,
            None => {
                return Err(wasm_error!(WasmErrorInner::Guest(
                    "mew must contain text".to_string()
                )))
            }
        },
        MewType::Reply(original_action_hash) => match mew.text {
            Some(mew_string) => create_reply(
                MewContent {
                    text: mew_string,
                    links: mew.links,
                },
                original_action_hash,
            )?,
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
            Some(mew_string) => create_quote(
                MewContent {
                    text: mew_string,
                    links: mew.links,
                },
                original_entry_hash,
            )?,
            None => {
                return Err(wasm_error!(WasmErrorInner::Guest(
                    "quote must contain text".to_string()
                )))
            }
        },
    };

    // Add record to time index
    let mew_record = get(mew_action_hash.clone(), GetOptions { strategy: GetStrategy::Content })?
        .ok_or(wasm_error!(WasmErrorInner::Guest("Failed to get mew_record".into())))?;
    let indexable_mew_record = IndexableRecord::from(mew_record);
    let _result = index_entry(TIME_INDEX_NAME.into(), indexable_mew_record, (), TIME_INDEX_LINK_TYPE, TIME_INDEX_PATH_LINK_TYPE)
        .map_err(|e| wasm_error!(WasmErrorInner::Guest(e.into())))?;
    
    Ok(mew_action_hash)
}

pub fn create_original_mew(mew_content: MewContent) -> ExternResult<ActionHash> {
    let mew = Mew {
        mew_type: MewType::Original,
        content: Some(mew_content.clone()),
    };
    let mew_action_hash = create_entry(EntryTypes::Mew(mew))?;

    let base = get_my_mews_base(MEW_PATH_SEGMENT, true)?;

    let _link_ah = create_link(base, mew_action_hash.clone(), LinkTypes::Mew, ())?;
    parse_mew_text(mew_content, mew_action_hash.clone())?;
    Ok(mew_action_hash)
}

pub fn create_reply(
    mew_content: MewContent,
    original_action_hash: ActionHash,
) -> ExternResult<ActionHash> {
    let mew = Mew {
        mew_type: MewType::Reply(original_action_hash.clone()),
        content: Some(mew_content.clone()),
    };
    let reply_action_hash = create_entry(EntryTypes::Mew(mew))?;

    let base = get_my_mews_base(MEW_PATH_SEGMENT, true)?;

    let _link_ah = create_link(base, reply_action_hash.clone(), LinkTypes::Mew, ())?;
    // link off original entry as reply
    let _reply_link_ah = create_link(
        original_action_hash.clone(),
        reply_action_hash.clone(),
        LinkTypes::Reply,
        LinkTag::new(REPLY_PATH_SEGMENT),
    )?;
    parse_mew_text(mew_content, reply_action_hash.clone())?;
    Ok(reply_action_hash)
}

pub fn create_mewmew(original_action_hash: ActionHash) -> ExternResult<ActionHash> {
    let mew = Mew {
        mew_type: MewType::MewMew(original_action_hash.clone().into()),
        content: None,
    };
    let mewmew_action_hash = create_entry(EntryTypes::Mew(mew))?;

    let base = get_my_mews_base(MEW_PATH_SEGMENT, true)?;

    let _link_ah = create_link(base, mewmew_action_hash.clone(), LinkTypes::Mew, ())?;
    // link off original entry as mewmew
    let _quote_link_ah = create_link(
        original_action_hash.clone(),
        mewmew_action_hash.clone(),
        LinkTypes::Mewmew,
        LinkTag::new(MEWMEW_PATH_SEGMENT),
    )?;
    Ok(mewmew_action_hash)
}

pub fn create_quote(
    mew_content: MewContent,
    original_action_hash: ActionHash,
) -> ExternResult<ActionHash> {
    let mew = Mew {
        mew_type: MewType::Quote(original_action_hash.clone()),
        content: Some(mew_content.clone()),
    };
    let quote_action_hash = create_entry(EntryTypes::Mew(mew))?;

    let base = get_my_mews_base(MEW_PATH_SEGMENT, true)?;

    let _link_ah = create_link(base, quote_action_hash.clone(), LinkTypes::Mew, ())?;
    // link off original entry as quote
    let _quote_link_ah = create_link(
        original_action_hash.clone(),
        quote_action_hash.clone(),
        LinkTypes::Quote,
        LinkTag::new(QUOTE_PATH_SEGMENT),
    )?;
    parse_mew_text(mew_content, quote_action_hash.clone())?;
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
        LinkTypes::Lick,
        Some(LinkTag::new(LICK_PATH_SEGMENT)),
    )?;
    let licks: Vec<AgentPubKey> = lick_links
        .into_iter()
        .map(|link| AgentPubKey::from(EntryHash::from(link.target)).into())
        .collect();

    let reply_links = get_links(
        action_hash.clone(),
        LinkTypes::Reply,
        Some(LinkTag::new(REPLY_PATH_SEGMENT)),
    )?;
    let replies: Vec<AnyLinkableHash> = reply_links
        .into_iter()
        .map(|link| link.target.into())
        .collect();

    let mewmew_links = get_links(
        action_hash.clone(),
        LinkTypes::Mewmew,
        Some(LinkTag::new(MEWMEW_PATH_SEGMENT)),
    )?;
    let mewmews: Vec<AnyLinkableHash> = mewmew_links
        .into_iter()
        .map(|mewmew| mewmew.target.into())
        .collect();

    let quote_links = get_links(
        action_hash.clone(),
        LinkTypes::Quote,
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
    let base = get_mews_base(agent, MEW_PATH_SEGMENT, false)?;
    let links = get_links(base, LinkTypes::Mew, None)?;

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

fn mews_recently_created(input: GetRecentMewsInput) -> ExternResult<Vec<FeedMew>> {
    let timestamp = sys_time()?.as_seconds_and_nanos();
    let until_datetime = DateTime::<Utc>::from_utc(NaiveDateTime::from_timestamp(timestamp.0, timestamp.1), Utc);
    let from_datetime = until_datetime - Duration::seconds(input.from_seconds_ago.into());

    // Get all mews with created in last 24 hours
    mews_created_in_date_range(from_datetime, until_datetime)
}


fn mews_created_in_date_range(from_datetime: DateTime<Utc>, until_datetime: DateTime<Utc>) -> ExternResult<Vec<FeedMew>> {
    let mew_links: Vec<Link> = get_links_for_time_span(
        TIME_INDEX_NAME.into(), 
        from_datetime, 
        until_datetime,
        None,
        None,
        TIME_INDEX_LINK_TYPE,
        TIME_INDEX_PATH_LINK_TYPE,
    ).map_err(|e| wasm_error!(WasmErrorInner::Guest(e.into())))?;
    
    let feedmews: Vec<FeedMew> = mew_links
        .into_iter()
        .filter_map(|l| get(EntryHash::from(l.target), GetOptions { ..Default::default() }).unwrap_or(None))
        .map(|record| get_feed_mew_and_context(record.action_hashed().hash.clone()).unwrap())
        .collect();

    Ok(feedmews)
}

#[hdk_extern]
pub fn mews_most_licked(input: GetRecentMewsInput) -> ExternResult<Vec<FeedMew>> {
    let feedmews = mews_recently_created(input.clone())?;

    // Sort mews by licks count, descending
    let mut feedmews_with_licks: Vec<FeedMew> = feedmews
        .into_iter()
        .filter(|a| a.licks.len() > 0)
        .collect();
    feedmews_with_licks.sort_by(|a, b| b.licks.len().cmp(&a.licks.len()));

    // Take first mews up to 'count'
    let mews = feedmews_with_licks.into_iter().take(input.count.into()).collect();
    
    Ok(mews)
}

#[hdk_extern]
pub fn mews_most_replied(input: GetRecentMewsInput) -> ExternResult<Vec<FeedMew>> {
    let feedmews = mews_recently_created(input.clone())?;

    // Sort mews by mewmews count, descending
    let mut feedmews_with_replies: Vec<FeedMew> = feedmews
        .into_iter()
        .filter(|a| a.replies.len() > 0)
        .collect();
    feedmews_with_replies.sort_by(|a, b| b.replies.len().cmp(&a.replies.len()));

    // Take first mews up to 'count'
    let mews = feedmews_with_replies.into_iter().take(input.count.into()).collect();
    
    Ok(mews)
}

#[hdk_extern]
pub fn mews_most_mewmewed(input: GetRecentMewsInput) -> ExternResult<Vec<FeedMew>> {
    let feedmews = mews_recently_created(input.clone())?;

    // Sort mews by mewmews count, descending
    let mut feedmews_with_mewmews: Vec<FeedMew> = feedmews
        .into_iter()
        .filter(|a| a.mewmews.len() > 0)
        .collect();
    feedmews_with_mewmews.sort_by(|a, b| b.mewmews.len().cmp(&a.mewmews.len()));

    // Take first mews up to 'count'
    let mews = feedmews_with_mewmews.into_iter().take(input.count.into()).collect();
    
    Ok(mews)
}

#[hdk_extern]
pub fn mews_most_quoted(input: GetRecentMewsInput) -> ExternResult<Vec<FeedMew>> {
    let feedmews = mews_recently_created(input.clone())?;

    // Sort mews by quotes count, descending
    let mut feedmews_with_quotes: Vec<FeedMew> = feedmews
        .into_iter()
        .filter(|a| a.quotes.len() > 0)
        .collect();
    feedmews_with_quotes.sort_by(|a, b| b.quotes.len().cmp(&a.quotes.len()));

    // Take first mews up to 'count'
    let mews = feedmews_with_quotes.into_iter().take(input.count.into()).collect();
    
    Ok(mews)
}

// *** Liking ***

#[hdk_extern]
pub fn lick_mew(action_hash: ActionHash) -> ExternResult<()> {
    let me: AgentPubKey = agent_info()?.agent_latest_pubkey;

    let base = get_my_mews_base(LICK_PATH_SEGMENT, true)?;
    let _my_lick_ah = create_link(base, action_hash.clone(), LinkTypes::Lick, ())?;
    let _mew_lick_ah = create_link(
        action_hash.clone(),
        me.clone(),
        LinkTypes::Lick,
        LinkTag::new(LICK_PATH_SEGMENT),
    )?;
    Ok(())
}

#[hdk_extern]
pub fn my_licks(_: ()) -> ExternResult<Vec<AnyLinkableHash>> {
    let me = agent_info()?.agent_latest_pubkey;
    licks_inner(me, LICK_PATH_SEGMENT)
}

// get mews licked by an agent
#[hdk_extern]
pub fn licks(agent: AgentPubKey) -> ExternResult<Vec<AnyLinkableHash>> {
    licks_inner(agent, LICK_PATH_SEGMENT)
}

fn licks_inner(agent: AgentPubKey, base_type: &str) -> ExternResult<Vec<AnyLinkableHash>> {
    let base = get_mews_base(agent, base_type, false)?;
    let links = get_links(base, LinkTypes::Lick, None)?;
    Ok(links.into_iter().map(|link| link.target).collect())
}

#[hdk_extern]
pub fn unlick_mew(action_hash: ActionHash) -> ExternResult<()> {
    let me: EntryHash = agent_info()?.agent_latest_pubkey.into();
    let mew_licks = get_links(action_hash.clone(), LinkTypes::Lick, None)?;
    for lick in mew_licks {
        if lick.target == me.clone().into() {
            let _delete_link_ah = delete_link(lick.create_link_hash)?;
            break;
        }
    }

    let my_licks = get_my_mews_base(LICK_PATH_SEGMENT, true)?;
    let links = get_links(my_licks.clone(), LinkTypes::Lick, None)?;
    for link in links {
        if link.target == action_hash.clone().into() {
            let _deleted_link_ah = delete_link(link.create_link_hash)?;
            break;
        }
    }
    Ok(())
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
    let _following_link_ah = create_link(me, them_target, LinkTypes::Follow, ())?;

    let them = get_mews_base(agent, FOLLOWER_PATH_SEGMENT, true)?;
    let _follower_link_ah = create_link(them, me_target, LinkTypes::Follow, ())?;
    Ok(())
}

#[hdk_extern]
pub fn unfollow(agent: AgentPubKey) -> ExternResult<()> {
    let them_target: EntryHash = AgentPubKey::from(agent.clone()).into();
    let me = get_my_mews_base(FOLLOWING_PATH_SEGMENT, true)?;
    let links = get_links(me.clone(), LinkTypes::Follow, None)?;
    for link in links {
        if link.target == them_target.clone().into() {
            let _deleted_link_ah = delete_link(link.create_link_hash)?;
            break;
        }
    }

    let me_target: EntryHash = agent_info()?.agent_latest_pubkey.into();
    let them = get_mews_base(agent, FOLLOWER_PATH_SEGMENT, true)?;
    let links = get_links(them.clone(), LinkTypes::Follow, None)?;
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
    follow_inner(me, FOLLOWER_PATH_SEGMENT)
}

// get who an agent is following
#[hdk_extern]
pub fn following(agent: AgentPubKey) -> ExternResult<Vec<AgentPubKey>> {
    follow_inner(agent, FOLLOWING_PATH_SEGMENT)
}

// get followers of an agent
#[hdk_extern]
pub fn followers(agent: AgentPubKey) -> ExternResult<Vec<AgentPubKey>> {
    follow_inner(agent, FOLLOWER_PATH_SEGMENT)
}

fn follow_inner(agent: AgentPubKey, base_type: &str) -> ExternResult<Vec<AgentPubKey>> {
    let base = get_mews_base(agent, base_type, false)?;
    let links = get_links(base, LinkTypes::Follow, None)?;
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
pub fn get_mews_with_cashtag(cashtag: String) -> ExternResult<Vec<FeedMew>> {
    let path = Path::from(format!("cashtags.{}", cashtag));
    Ok(get_mews_from_path(path)?)
}

#[hdk_extern]
pub fn get_mews_with_mention(agent_pub_key: AgentPubKey) -> ExternResult<Vec<FeedMew>> {
    let path = Path::from(format!("mentions.{}", agent_pub_key));
    Ok(get_mews_from_path(path)?)
}

pub fn get_mews_from_path(path: Path) -> ExternResult<Vec<FeedMew>> {
    let path_hash = path.path_entry_hash()?;

    let links = get_links(path_hash, LinkTypes::Tag, None)?;
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

pub fn parse_mew_text(mew_content: MewContent, mew_hash: ActionHash) -> ExternResult<()> {
    let hashtag_regex = Regex::new(r"#\w+").unwrap();
    let cashtag_regex = Regex::new(r"\$\w+").unwrap();
    for mat in hashtag_regex.find_iter(&mew_content.text.clone()) {
        create_mew_tag_links("hashtags", mat.as_str(), mew_hash.clone())?;
    }
    for mat in cashtag_regex.find_iter(&mew_content.text.clone()) {
       create_mew_tag_links("cashtags", mat.as_str(), mew_hash.clone())?;
    }
    if let Some(links) = mew_content.links {
        for link in links {
            match link {
                LinkTarget::Mention(mention) => {
                    let path = Path::from(format!("mentions.{}", mention));
                    let path_hash = path.path_entry_hash()?;
                    let _link_ah = create_link(path_hash, mew_hash.clone(), LinkTypes::Tag, ())?;
                }
                _ => ()
            }
        }
    }
    Ok(())
}

#[hdk_extern]
pub fn search_hashtags(query: String) -> ExternResult<Vec<String>> {
    search_tags("hashtags".into(), query)
}

#[hdk_extern]
pub fn search_cashtags(query: String) -> ExternResult<Vec<String>> {
    search_tags("cashtags".into(), query)
}

fn search_tags(path_stem: String, content: String) -> ExternResult<Vec<String>> {
    let prefix: String = content.chars().take(3).collect();
    let path = Path::from(format!("search_{}.{}", path_stem, prefix));

    let links = get_links(path.path_entry_hash()?, LinkTypes::TagPrefix, None)?;

    let tags: Vec<String> = links
        .into_iter()
        .map(|link| 
            String::from_utf8(link.tag.into_inner()).map_err(|_| wasm_error!(WasmErrorInner::Guest("Failed to convert link tag to string".into())))

        )
        .filter_map(Result::ok)
        .collect();

    Ok(tags)
}

fn create_mew_tag_links(path_stem: &str, content: &str, mew_hash: ActionHash) -> ExternResult<()> {
    // Link from Path cashtags.mytag -> mew
    let path = Path::from(format!("{}.{}", path_stem, content));
    let path_hash = path.path_entry_hash()?;
    path.typed(LinkTypes::Tag)?.ensure()?;
    let _link_ah = create_link(path_hash.clone(), mew_hash, LinkTypes::Tag, ())?;
 
    // Create Path for sliced hashtag (first 3 characters) under hashtags_search.myt
    // Link from Path hashtags.myt -> hashtags.mytag Path 
    let word: String =  content.chars().skip(1).collect();
    let word_lowercase = word.to_lowercase();
    let prefix: String = word_lowercase.chars().take(3).collect();
 
    let search_path = Path::from(format!("search_{}.{}", path_stem, prefix));
    let search_path_hash = search_path.path_entry_hash()?;
    search_path.typed(LinkTypes::TagPrefix)?.ensure()?;
    let _link_search_tag = create_link(search_path_hash, path_hash.clone(), LinkTypes::TagPrefix, word.as_bytes().to_vec())?;

    Ok(())
}

// *** Rankings ***
#[hdk_extern(infallible)]
fn scheduled_check_publish_rankings(_: Option<Schedule>) -> Option<Schedule> {
    let timestamp = sys_time().unwrap().as_seconds_and_nanos();
    let datetime = DateTime::<Utc>::from_utc(NaiveDateTime::from_timestamp(timestamp.0, timestamp.1), Utc);
    let year = datetime.year();
    let month = datetime.month();
    let iso_week = datetime.iso_week().week();
    let ordinal = datetime.ordinal();

    for ranking_type in MewRanking::iter() {
        // Year
        check_generate_rankings(
            ranking_type.clone(),
            Path::from(format!("rankings_index.by_year.{}", year - 1)),
            date_range_year(year)
        ).unwrap();

        // Month 
        check_generate_rankings(
            ranking_type.clone(),
            Path::from(format!("rankings_index.by_month.{}.{}", year, month - 1)),
            date_range_month(year, month)
        ).unwrap();

        // Week
        check_generate_rankings(
            ranking_type.clone(),
            Path::from(format!("rankings_index.by_week.{}.{}", year, iso_week - 1)),
            date_range_week(year, iso_week)
        ).unwrap();

        // Day
        check_generate_rankings(
            ranking_type,
            Path::from(format!("rankings_index.by_day.{}.{}", year, ordinal - 1)),
            date_range_day(year, ordinal)
        ).unwrap();
    }

    // Scheduled to run daily at 12:00AM, collecting the previous days rankings
    Some(Schedule::Persisted("0 0 * * *".into()))
}

pub fn check_generate_rankings(ranking_type: MewRanking, base_path: Path, date_range: (DateTime<Utc>, DateTime<Utc>)) -> ExternResult<()> {
    // Get DNA properties
    let dna_properties = DnaProperties::try_from(dna_info()?.properties)
        .map_err(|err| wasm_error!(WasmErrorInner::Guest(err.into())))?;
    let redundant_rankings_count = dna_properties.redundant_rankings_count;
    let ranking_count = dna_properties.ranking_count;
    
    // Ensure base_path exists
    let ranking_link_type = match ranking_type {
        MewRanking::MostLicks => LinkTypes::RankingIndexMewsMostLicks,
        MewRanking::MostReplies => LinkTypes::RankingIndexMewsMostReplies,
        MewRanking::MostQuotes => LinkTypes::RankingIndexMewsMostQuotes,
        MewRanking::MostMewmews => LinkTypes::RankingIndexMewsMostMewmews,
    };
    let typed_base_path = base_path.clone().typed(ranking_link_type)?;
    typed_base_path.ensure()?;

    // Check if there are already redundant_rankings_count redundant ranking indexes
    let existing_ranking_agents = get_links(typed_base_path.path_entry_hash()?, ranking_link_type, None)?;
    if existing_ranking_agents.len() < redundant_rankings_count {                 
        // Generate new ranking index
        let ranking_index = RankingIndex::new_with_default_mod(ScopedLinkType::try_from(ranking_link_type)?);

        // Associate my ranking index with my agent pub key
        let mut ranking_base_path = base_path.clone();
        ranking_base_path.append_component(Component::from(format!("{}", agent_info()?.agent_initial_pubkey)));
       
        // Generate rankings
        let mut feedmews = mews_created_in_date_range(date_range.0, date_range.1)?;
        feedmews.sort_by_key(|a| ranking_type.score(a.clone()));
        let feedmews_counted: Vec<FeedMew> = feedmews.into_iter().take(ranking_count).collect();

        // Save rankings to my ranking index
        for feedmew in feedmews_counted {
            ranking_index.create_ranking(
                AnyLinkableHash::from(feedmew.clone().action_hash), 
                ranking_type.score(feedmew), 
                None
            )?;
        }
    }

    Ok(())
}

/// Generates an eventually-consistent "psuedo-consensus" view of Rankings, aggregating the ranking indexes generated by multiple other agents
/// The process is:
///     - get all rankings links
///     - de-duplicate identical rankings by different agents (i.e. matching base, target and link type)
///     - calculate ranking yourself, sort by ranking
///     - take first `count` of list
/// 
/// Trust Model:
///     - Inclusion of entries in rankings list: 1/N (where N is the number of agents generating ranking indices for a round)
///     - Sorting of rankings list: 0/N (every agent performs their own sorting and top X selection)
pub fn get_rankings_consensus(ranking_type: MewRanking, base_path: Path) -> ExternResult<Vec<FeedMew>> {
    // Get DNA properties
    let dna_properties = DnaProperties::try_from(dna_info()?.properties)
        .map_err(|err| wasm_error!(WasmErrorInner::Guest(err.into())))?;
    let count = dna_properties.ranking_count;
    

    // Ensure base_path exists
    let ranking_link_type = match ranking_type {
        MewRanking::MostLicks => LinkTypes::RankingIndexMewsMostLicks,
        MewRanking::MostReplies => LinkTypes::RankingIndexMewsMostReplies,
        MewRanking::MostQuotes => LinkTypes::RankingIndexMewsMostQuotes,
        MewRanking::MostMewmews => LinkTypes::RankingIndexMewsMostMewmews,
    };
    let base_path_typed = base_path.typed(ranking_link_type)?;
    
    let all_rankings = base_path_typed.children()?;
    
    // De-duplicate ranking links
    let mut ranking_links_set = HashSet::new();
    for ranking_link in all_rankings {
        ranking_links_set.insert(DedupableLink(ranking_link));
    }

    // Get FeedMews
    let mut feedmews: Vec<FeedMew> = ranking_links_set
        .into_iter()
        .filter_map(|l| get(ActionHash::from(l.0.target), GetOptions { ..Default::default() }).unwrap_or(None))
        .map(|record| get_feed_mew_and_context(record.action_hashed().hash.clone()).unwrap())
        .collect();

    // Order by score, descending
    feedmews.sort_by_key(|a| ranking_type.score(a.clone()));

    // Take first count
    let feedmews_ranked_counted = feedmews.into_iter().take(count.try_into().unwrap()).collect();

    Ok(feedmews_ranked_counted)
}

#[hdk_extern]
pub fn get_rankings_consensus_by_year(input: GetRankedMewsByYearInput) -> ExternResult<Vec<FeedMew>> {
    get_rankings_consensus(
        input.ranking_type,
        Path::from(format!("rankings_index.by_year.{}", input.year))
    )
}

#[hdk_extern]
pub fn get_rankings_consensus_by_month(input: GetRankedMewsByMonthInput) -> ExternResult<Vec<FeedMew>> {
    get_rankings_consensus(
        input.ranking_type,
        Path::from(format!("rankings_index.by_month.{}.{}", input.year, input.month))
    )
}

#[hdk_extern]
pub fn get_rankings_consensus_by_week(input: GetRankedMewsByWeekInput) -> ExternResult<Vec<FeedMew>> {
    get_rankings_consensus(
        input.ranking_type,
        Path::from(format!("rankings_index.by_week.{}.{}", input.year, input.iso_week))

    )
}

#[hdk_extern]
pub fn get_rankings_consensus_by_day(input: GetRankedMewsByDayInput) -> ExternResult<Vec<FeedMew>> {
    get_rankings_consensus(
        input.ranking_type,
        Path::from(format!("rankings_index.by_day.{}.{}", input.year, input.ordinal))
    )
}