// use crate::hashtag_to_mews::*;
use crate::mew_with_context::get_batch_mews_with_context;
// use hc_call_utils::call_local_zome;
use hdk::prelude::*;
use mews_integrity::*;
// use trust_atom_types::{QueryMineInput, TrustAtom};

#[hdk_extern]
pub fn get_all_mews(_: ()) -> ExternResult<Vec<Record>> {
    let hashes = get_all_mew_hashes()?;
    let get_input: Vec<GetInput> = hashes
        .into_iter()
        .map(|hash| GetInput::new(hash.into(), GetOptions::default()))
        .collect();
    let records = HDK.with(|hdk| hdk.borrow().get(get_input))?;
    let records: Vec<Record> = records.into_iter().flatten().collect();

    Ok(records)
}

#[hdk_extern]
pub fn get_all_mews_with_context(_: ()) -> ExternResult<Vec<FeedMew>> {
    let hashes = get_all_mew_hashes()?;

    get_batch_mews_with_context(hashes)
}

// #[hdk_extern]
// pub fn get_trusted_mews_with_context(input: RecommendedInput) -> ExternResult<Vec<FeedMew>> {
//     let _oldest_mew_seconds = input.oldest_mew_seconds.unwrap_or(60 * 60 * 24 * 7 * 2);

//     // get all TrustAtoms -- topic/author combos "rated" by this agent
//     let trust_atoms: Vec<TrustAtom> = call_local_zome(
//         "trust_atom",
//         "query_mine",
//         QueryMineInput {
//             target: None,
//             content_full: None,
//             content_starts_with: None,
//             // content_not_starts_with: Some(String::from("__")),  // TODO use this or manually filter
//             value_starts_with: None,
//         },
//     )?;

//     let topics_by_author: Vec<TrustAtom> = trust_atoms
//         .into_iter()
//         .filter(|atom| match atom.content.clone() {
//             Some(content) => content != FOLLOW_TOPIC,
//             None => true,
//         })
//         .collect();

//     // debug!("topics_by_author: {:#?}", topics_by_author);

//     // filter for those TrustAtoms above a weight threshold (>= 0)
//     let recomended_topics_by_author =
//         topics_by_author
//             .into_iter()
//             .filter_map(|atom| match atom.value.clone() {
//                 Some(value_string) => {
//                     let value_float: Result<f32, _> = value_string.parse();
//                     match value_float {
//                         Ok(value_float) => {
//                             if value_float >= 0f32 {
//                                 // let key = format!(
//                                 //     "{}{}",
//                                 //     atom.target_hash.clone(),
//                                 //     atom.content.clone().unwrap_or(String::from(""))
//                                 // );
//                                 Some(atom)
//                             } else {
//                                 None
//                             }
//                         }
//                         _ => None,
//                     }
//                 }
//                 None => None, // null value/weight is allowed in TrustAtom lib, but not in MewsFeed
//             });

//     debug!(
//         "recomended_topics_by_author: {:#?}",
//         recomended_topics_by_author,
//     );

//     // get all mews by those authors
//     let trust_feed_mews: Vec<FeedMew> = recomended_topics_by_author
//         .flat_map(|atom| {
//             let followed_author = atom.target_hash.clone().into_agent_pub_key();
//             if let Some(pubkey) = followed_author {
//                 match atom.content.clone() {
//                     None => vec![], // TODO get all mews by this author
//                     Some(content) => {
//                         let feed_mews_result = get_mews_for_hashtag_by_author_with_context(
//                             format!("#{}", content), // add # (hash) to make it a hashtag
//                             pubkey,
//                         );
//                         // debug!("feed_mews_result: {:#?}", feed_mews_result);
//                         match feed_mews_result {
//                             Ok(feed_mews) => feed_mews
//                                 .into_iter()
//                                 .map(|feed_mew| FeedMew {
//                                     weight: Some(
//                                         atom.value
//                                             .clone()
//                                             .unwrap_or_else(|| String::from("0"))
//                                             .parse::<f32>()
//                                             .unwrap_or(0.0),
//                                     ),
//                                     topic: atom.content.clone(),
//                                     ..feed_mew
//                                 })
//                                 .collect(),
//                             Err(_) => vec![],
//                         }
//                     }
//                 }
//             } else {
//                 vec![]
//             }
//         })
//         .collect();

//     debug!(
//         "trust_feed_mews: {:#?}",
//         trust_feed_mews
//             .clone()
//             .into_iter()
//             .map(|feed_mew| feed_mew.clone().mew.text)
//             .collect::<Vec<String>>()
//     );

//     Ok(trust_feed_mews)
// }
pub fn get_all_mew_hashes() -> ExternResult<Vec<ActionHash>> {
    let path = Path::from("all_mews");
    let mut links = get_links(path.path_entry_hash()?, LinkTypes::AllMews, None)?;
    links.sort_by_key(|a| a.timestamp);
    let hashes: Vec<ActionHash> = links
        .into_iter()
        .filter_map(|link| ActionHash::try_from(link.target).ok())
        .collect();

    Ok(hashes)
}
