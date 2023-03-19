use hdk::prelude::*;
use itertools::Itertools;
use mews_integrity::*;
use regex::Regex;
use trust_atom_types::{QueryMineInput, TrustAtom, TrustAtomInput};

fn get_my_mews_base(base_type: &str, ensure: bool) -> ExternResult<EntryHash> {
    let me: AgentPubKey = agent_info()?.agent_latest_pubkey;
    get_mews_base(me, base_type, ensure)
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
        original_action_hash,
        reply_action_hash.clone(),
        LinkTypes::Reply,
        LinkTag::new(REPLY_PATH_SEGMENT),
    )?;
    parse_mew_text(mew_content, reply_action_hash.clone())?;
    Ok(reply_action_hash)
}

pub fn create_mewmew(original_action_hash: ActionHash) -> ExternResult<ActionHash> {
    let mew = Mew {
        mew_type: MewType::MewMew(original_action_hash.clone()),
        content: None,
    };
    let mewmew_action_hash = create_entry(EntryTypes::Mew(mew))?;

    let base = get_my_mews_base(MEW_PATH_SEGMENT, true)?;

    let _link_ah = create_link(base, mewmew_action_hash.clone(), LinkTypes::Mew, ())?;
    // link off original entry as mewmew
    let _quote_link_ah = create_link(
        original_action_hash,
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
        original_action_hash,
        quote_action_hash.clone(),
        LinkTypes::Quote,
        LinkTag::new(QUOTE_PATH_SEGMENT),
    )?;
    parse_mew_text(mew_content, quote_action_hash.clone())?;
    Ok(quote_action_hash)
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
        .map(|link| AgentPubKey::from(EntryHash::from(link.target)))
        .collect();

    let reply_links = get_links(
        action_hash.clone(),
        LinkTypes::Reply,
        Some(LinkTag::new(REPLY_PATH_SEGMENT)),
    )?;
    let replies: Vec<AnyLinkableHash> = reply_links.into_iter().map(|link| link.target).collect();

    let mewmew_links = get_links(
        action_hash.clone(),
        LinkTypes::Mewmew,
        Some(LinkTag::new(MEWMEW_PATH_SEGMENT)),
    )?;
    let mewmews: Vec<AnyLinkableHash> = mewmew_links
        .into_iter()
        .map(|mewmew| mewmew.target)
        .collect();

    let quote_links = get_links(
        action_hash,
        LinkTypes::Quote,
        Some(LinkTag::new(QUOTE_PATH_SEGMENT)),
    )?;
    let quotes: Vec<AnyLinkableHash> = quote_links.into_iter().map(|link| link.target).collect();

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
        .map(|link| get_feed_mew_and_context(ActionHash::from(link.target)))
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

#[hdk_extern]
pub fn recommended(input: RecommendedInput) -> ExternResult<Vec<TrustFeedMew>> {
    let oldest_mew_seconds = input.oldest_mew_seconds.unwrap_or(60 * 60 * 24 * 7 * 2);

    // get all TrustAtoms -- topic/author combos "rated" by this agent
    let topics_by_author: Vec<TrustAtom> = call_local_zome(
        "trust_atom",
        "query_mine",
        QueryMineInput {
            target: None,
            content_full: None,
            content_starts_with: None,
            value_starts_with: None,
        },
    )?;

    // filter for those TrustAtoms above a weight threshold (>= 0)
    let recomended_topics_by_author =
        topics_by_author
            .into_iter()
            .filter_map(|atom| match atom.value.clone() {
                Some(value_string) => {
                    let value_float: Result<f32, _> = value_string.parse();
                    match value_float {
                        Ok(value_float) => {
                            if value_float >= 0f32 {
                                // let key = format!(
                                //     "{}{}",
                                //     atom.target_hash.clone(),
                                //     atom.content.clone().unwrap_or(String::from(""))
                                // );
                                Some(atom)
                            } else {
                                None
                            }
                        }
                        _ => None,
                    }
                }
                None => None, // null value/weight is allowed in TrustAtom lib, but not in MewsFeed
            });

    let mut trust_feed_mews: Vec<TrustFeedMew> = recomended_topics_by_author
        .flat_map(|atom| {
            let followed_author = atom.target_hash.clone();
            match atom.content.clone() {
                None => vec![], // TODO get all mews by this author
                Some(content) => {
                    let feed_mews_result = get_mews_with_hashtag_by_author(
                        format!("#{}", content), // add # (hash) to make it a hashtag
                        AgentPubKey::from(EntryHash::from(followed_author)), // TODO both are fallible, should be `try_from`?
                    );
                    // debug!("feed_mews_result: {:#?}", feed_mews_result);
                    match feed_mews_result {
                        Ok(feed_mews) => feed_mews
                            .into_iter()
                            .map(|feed_mew| TrustFeedMew {
                                feed_mew,
                                weight: atom
                                    .value
                                    .clone()
                                    .unwrap_or_else(|| String::from("0"))
                                    .parse::<f32>()
                                    .unwrap_or(0.0),
                                topic: atom.content.clone(),
                            })
                            .collect(),
                        Err(_) => vec![],
                    }
                }
            }
        })
        .collect();

    // TODO should we get other types: mewmews, quotes, etc

    // TODO *maybe* also  order these posts according to some combination of: weight of tags and recency
    // (don't want to see very old highly weighted at top)
    // hmmm its complicated!  if only showing last time chunk, or (later) mews since last visit
    // it really depends if that last chunk is 100 mews (chron fine) or 10,000 mews (then weight of tags is awesome)

    // TODO consider mews that are 3 weeks old but have recent interaction, maybe even from trusted parties

    // filter out any mews that are older than 2 weeks
    // sort mews by weight of topic for that author

    trust_feed_mews = trust_feed_mews
        .into_iter()
        .filter_map(|trust_feed_mew| {
            let allowed_age = core::time::Duration::new(oldest_mew_seconds, 0);
            let oldest_allowed = input.now.saturating_sub(&allowed_age);

            if trust_feed_mew.feed_mew.action.timestamp() >= oldest_allowed {
                Some(trust_feed_mew)
            } else {
                None
            }
        })
        .collect();

    trust_feed_mews.sort_by(|a, b| {
        b.weight
            .partial_cmp(&a.weight)
            .unwrap_or(std::cmp::Ordering::Equal)
    });

    Ok(trust_feed_mews)
}

// *** Liking ***

#[hdk_extern]
pub fn lick_mew(action_hash: ActionHash) -> ExternResult<()> {
    let me: AgentPubKey = agent_info()?.agent_latest_pubkey;

    let base = get_my_mews_base(LICK_PATH_SEGMENT, true)?;
    let _my_lick_ah = create_link(base, action_hash.clone(), LinkTypes::Lick, ())?;
    let _mew_lick_ah = create_link(
        action_hash,
        me,
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
    let links = get_links(my_licks, LinkTypes::Lick, None)?;
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
pub fn follow(input: FollowInput) -> ExternResult<()> {
    let me_target: EntryHash = agent_info()?.agent_latest_pubkey.into();
    let them_target: EntryHash = input.agent.clone().into();

    if me_target == them_target {
        return Err(wasm_error!(WasmErrorInner::Guest(String::from(
            "Cannot follow yourself."
        ))));
    }

    let me = get_my_mews_base(FOLLOWING_PATH_SEGMENT, true)?;
    let _following_link_ah = create_link(me, them_target.clone(), LinkTypes::Follow, ())?;

    let them = get_mews_base(input.agent, FOLLOWER_PATH_SEGMENT, true)?;
    let _follower_link_ah = create_link(them, me_target, LinkTypes::Follow, ())?;

    for follow_topic in input.follow_topics {
        let _: TrustAtom = call_local_zome(
            "trust_atom",
            "create_trust_atom",
            TrustAtomInput {
                target: AnyLinkableHash::from(them_target.clone()),
                content: Some(follow_topic.topic),
                value: Some(follow_topic.weight),
                extra: None,
            },
        )?;
    }
    Ok(())
}

#[hdk_extern]
pub fn unfollow(agent: AgentPubKey) -> ExternResult<()> {
    let them_target: EntryHash = agent.clone().into();
    let me = get_my_mews_base(FOLLOWING_PATH_SEGMENT, true)?;
    let links = get_links(me, LinkTypes::Follow, None)?;
    for link in links {
        if link.target == them_target.clone().into() {
            let _deleted_link_ah = delete_link(link.create_link_hash)?;
            break;
        }
    }

    let me_target: EntryHash = agent_info()?.agent_latest_pubkey.into();
    let them = get_mews_base(agent, FOLLOWER_PATH_SEGMENT, true)?;
    let links = get_links(them, LinkTypes::Follow, None)?;
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
        .map(|link| AgentPubKey::from(EntryHash::from(link.target)))
        .collect())
}

// *** Tagging (hashtag, cashtag, mention) ***

#[hdk_extern]
pub fn get_mews_with_hashtag(hashtag: String) -> ExternResult<Vec<FeedMew>> {
    let path = Path::from(format!("hashtags.{}", hashtag));
    get_mews_from_path(path)
}

fn get_mews_with_hashtag_by_author(
    hashtag: String,
    author: AgentPubKey,
) -> ExternResult<Vec<FeedMew>> {
    // debug!("search -- hashtags.{}", hashtag);
    let path = Path::from(format!("hashtags.{}", hashtag));
    get_mews_from_path_by_author(path, author)
}

#[hdk_extern]
pub fn get_mews_with_cashtag(cashtag: String) -> ExternResult<Vec<FeedMew>> {
    let path = Path::from(format!("cashtags.{}", cashtag));
    get_mews_from_path(path)
}

#[hdk_extern]
pub fn get_mews_with_mention(agent_pub_key: AgentPubKey) -> ExternResult<Vec<FeedMew>> {
    let path = Path::from(format!("mentions.{}", agent_pub_key));
    get_mews_from_path(path)
}

fn get_mews_from_path_by_author(path: Path, author: AgentPubKey) -> ExternResult<Vec<FeedMew>> {
    let mut full_path = path;
    full_path.append_component(hdk::hash_path::path::Component::from("by".to_string()));
    full_path.append_component(hdk::hash_path::path::Component::from(author.to_string()));

    // full_path
    //     .map(|c| String::try_from(&c))
    //         .collect::<Result<Vec<String>, SerializedBytesError>>()

    // let path_components: Vec<hdk::hash_path::path::Component> = full_path.clone().into();
    // path_components
    //     .into_iter()
    //     .map(|component| debug!("component:-- {:?}", String::try_from(&component)));

    get_mews_from_path(full_path)
}

pub fn get_mews_from_path(path: Path) -> ExternResult<Vec<FeedMew>> {
    let path_hash = path.path_entry_hash()?;

    let links = get_links(path_hash, LinkTypes::Tag, None)?;

    // Deduplicate links to the same mew
    let mut mews: Vec<FeedMew> = links
        .into_iter()
        .unique_by(|l| l.target.clone())
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
    for mat in hashtag_regex.find_iter(&mew_content.text) {
        create_mew_tag_links("hashtags", mat.as_str(), mew_hash.clone())?;
    }
    for mat in cashtag_regex.find_iter(&mew_content.text) {
        create_mew_tag_links("cashtags", mat.as_str(), mew_hash.clone())?;
    }
    if let Some(links) = mew_content.links {
        for link in links {
            if let LinkTarget::Mention(mention) = link {
                let path = Path::from(format!("mentions.{}", mention));
                let path_hash = path.path_entry_hash()?;
                let _link_ah = create_link(path_hash, mew_hash.clone(), LinkTypes::Tag, ())?;
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
        .map(|link| {
            String::from_utf8(link.tag.into_inner()).map_err(|_| {
                wasm_error!(WasmErrorInner::Guest(
                    "Failed to convert link tag to string".into()
                ))
            })
        })
        .filter_map(Result::ok)
        .collect();

    Ok(tags)
}

fn create_mew_tag_links(path_stem: &str, content: &str, mew_hash: ActionHash) -> ExternResult<()> {
    // Link from Path cashtags.mytag -> mew
    // debug!("path --- {}.{}", path_stem, content);
    let path = Path::from(format!("{}.{}", path_stem, content));
    let path_hash = path.path_entry_hash()?;
    path.typed(LinkTypes::Tag)?.ensure()?;
    create_link(path_hash, mew_hash.clone(), LinkTypes::Tag, ())?;

    let me = agent_info()?.agent_latest_pubkey;
    // debug!("path --- {}.{}.by.{}", path_stem, content, me);
    let path = Path::from(format!("{}.{}.by.{}", path_stem, content, me));
    let path_hash = path.path_entry_hash()?;
    path.typed(LinkTypes::Tag)?.ensure()?;
    create_link(path_hash.clone(), mew_hash, LinkTypes::Tag, ())?;

    // Create Path for sliced hashtag (first 3 characters) under hashtags_search.myt
    // Link from Path hashtags.myt -> hashtags.mytag Path
    let word: String = content.chars().skip(1).collect();
    let word_lowercase = word.to_lowercase();
    let prefix: String = word_lowercase.chars().take(3).collect();

    let search_path = Path::from(format!("search_{}.{}", path_stem, prefix));
    let search_path_hash = search_path.path_entry_hash()?;
    search_path.typed(LinkTypes::TagPrefix)?.ensure()?;
    create_link(
        search_path_hash,
        path_hash,
        LinkTypes::TagPrefix,
        word.as_bytes().to_vec(),
    )?;

    Ok(())
}

// HELPERS:

pub fn call_local_zome<T, A>(zome_name: &str, fn_name: &str, input: A) -> ExternResult<T>
where
    T: serde::de::DeserializeOwned + std::fmt::Debug,
    A: serde::Serialize + std::fmt::Debug,
{
    let response = call(
        CallTargetCell::Local,
        ZomeName::from(zome_name),
        FunctionName::from(fn_name),
        None,
        input,
    )?;

    let result_io = match response {
        ZomeCallResponse::Ok(bytes) => Ok(bytes),
        ZomeCallResponse::Unauthorized(zome_call_auth, cell_id, zome, func, agent) => Err(
            wasm_error!("ZomeCallResponse::Unauthorized: zome_call_auth: {:?}, cell_id: {:?}, zome: {:?}, func: {:?}, agent: {:?}", zome_call_auth, cell_id, zome, func, agent))
        ,
        ZomeCallResponse::NetworkError(message) => Err(wasm_error!("ZomeCallResponse::NetworkError: {}", message)),
        ZomeCallResponse::CountersigningSession(message) => {
            Err(wasm_error!("ZomeCallResponse::CountersigningSession: {}", message))
        }
    }?;

    let result: T = result_io.decode().map_err(|error|
        wasm_error!(
            "Could not decode response to local zome call (zome: {}) (function: {}) (response length in bytes: {}): (message: {})",
            zome_name,
            fn_name,
            result_io.as_bytes().len(),
            error
        )
    )?;

    Ok(result)
}
