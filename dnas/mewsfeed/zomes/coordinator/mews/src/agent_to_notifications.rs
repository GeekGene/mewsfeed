use crate::agent_mews::get_agent_mews;
use crate::mew_to_responses::{get_responses_for_mew, GetResponsesForMewInput};
use crate::mew_with_context::get_mew_with_context;
use hc_call_utils::call_local_zome;
use hdk::prelude::*;
use mews_types::{Mew, MewType, Notification, NotificationType, Profile};
use std::cmp::Reverse;

#[hdk_extern]
pub fn get_notifications_for_agent(agent: AgentPubKey) -> ExternResult<Vec<Notification>> {
    let my_mews = get_agent_mews(agent.clone())?;

    let agent_link_details = get_link_details(
        agent.clone(),
        LinkTypeFilter::Types(vec![
            // Mentions of agent (MentionToMews)
            (ZomeIndex(1), vec![LinkType(6)]),
            // Follows of agent (CreatorToFollowers)
            (ZomeIndex(2), vec![LinkType(1)]),
        ]),
        None,
    )?;

    let mut all_link_details = my_mews
        .iter()
        .map(|mew| {
            get_link_details(
                mew.action_hashed().hash.clone(),
                LinkTypeFilter::Types(vec![
                    // MewToResponses
                    (ZomeIndex(1), vec![LinkType(5)]),
                    // HashToLikers
                    (ZomeIndex(3), vec![LinkType(1)]),
                    // HashToPinners
                    (ZomeIndex(4), vec![LinkType(1)]),
                ]),
                None,
            )
        })
        .collect::<ExternResult<Vec<LinkDetails>>>()?;

    if !agent_link_details.clone().into_inner().is_empty() {
        all_link_details.push(agent_link_details);
    }

    let mut notifications: Vec<Notification> = all_link_details
        .iter()
        .map(|link_details| -> ExternResult<Vec<Vec<Notification>>> {
            link_details.clone().into_inner()
                .iter()
                .map(|(create_action_hashed, delete_actions_hashed)|  -> ExternResult<Vec<Notification>> {
                    let create = match create_action_hashed.action() {
                        Action::CreateLink(a) => Ok(a.clone()),
                        _ => Err(wasm_error!(WasmErrorInner::Guest("Expected first element of LinkDetails to be CreateLink".into())))
                    }?;
                    let deletes = delete_actions_hashed
                        .iter()
                        .map(|action_hashed| -> ExternResult<DeleteLink> {
                            match action_hashed.action() {
                                Action::DeleteLink(a) => Ok(a.clone()),
                                _ => Err(wasm_error!(WasmErrorInner::Guest("Expected first element of LinkDetails to be CreateLink".into())))
                            }
                        })
                        .collect::<ExternResult<Vec<DeleteLink>>>()?;

                    make_notifications(create, deletes)
                })
                .collect::<ExternResult<Vec<Vec<Notification>>>>()
        })
        .collect::<ExternResult<Vec<Vec<Vec<Notification>>>>>()?
        .iter()
        .flatten()
        .flatten()
        .cloned()
        .collect();

    // Responses to Mews I have responded to
    let mew_hashes_i_responded_to: Vec<ActionHash> = my_mews
        .iter()
        .filter_map(|record| match record.entry().to_app_option::<Mew>().ok() {
            Some(Some(mew)) => match mew.mew_type {
                MewType::Reply(ah) | MewType::Quote(ah) | MewType::Mewmew(ah) => Some(ah),
                _ => None,
            },
            _ => None,
        })
        .collect();
    let mews_responding_to_mews_i_responded_to: Vec<Record> = mew_hashes_i_responded_to
        .iter()
        .map(|ah| {
            get_responses_for_mew(GetResponsesForMewInput {
                original_mew_hash: ah.clone(),
                response_type: None,
            })
        })
        .collect::<ExternResult<Vec<Vec<Record>>>>()?
        .iter()
        .flatten()
        .cloned()
        .filter(|r| r.action().author().clone() != agent.clone())
        .collect();

    let mut n = make_notifications_for_records(
        mews_responding_to_mews_i_responded_to,
        NotificationType::FollowedYarnResponded,
        true,
    )?;
    notifications.append(&mut n);

    // All of this combined into one list sorted by timestamp descending
    notifications.sort_by_key(|n| Reverse(n.timestamp));

    Ok(notifications)
}

#[hdk_extern]
pub fn get_my_notifications(_: ()) -> ExternResult<Vec<Notification>> {
    get_notifications_for_agent(agent_info()?.agent_initial_pubkey)
}

fn make_notifications(
    create: CreateLink,
    deletes: Vec<DeleteLink>,
) -> ExternResult<Vec<Notification>> {
    match (create.zome_index, create.link_type) {
        // MentionToMews
        (ZomeIndex(1), LinkType(6)) => {
            let feed_mew_hash = Some(ActionHash::from(create.target_address.clone()));

            make_notifications_for_createlinks(
                vec![create],
                NotificationType::MyAgentMentioned,
                feed_mew_hash,
            )
        }

        // CreatorToFollowers
        (ZomeIndex(2), LinkType(1)) => {
            let mut all_notifications = make_notifications_for_createlinks(
                vec![create],
                NotificationType::MyAgentFollowed,
                None,
            )?;

            let mut delete_notifications = make_notifications_for_deletelinks(
                deletes,
                NotificationType::MyAgentUnfollowed,
                None,
            )?;
            all_notifications.append(&mut delete_notifications);

            Ok(all_notifications)
        }

        // MewToResponses
        (ZomeIndex(1), LinkType(5)) => {
            let feed_mew_hash = Some(ActionHash::from(create.target_address.clone()));

            make_notifications_for_createlinks(
                vec![create],
                NotificationType::MyMewResponded,
                feed_mew_hash,
            )
        }

        // HashToLikers
        (ZomeIndex(3), LinkType(1)) => {
            let feed_mew_hash = Some(ActionHash::from(create.base_address.clone()));

            let mut all_notifications = make_notifications_for_createlinks(
                vec![create],
                NotificationType::MyMewLicked,
                feed_mew_hash.clone(),
            )?;

            let mut delete_notifications = make_notifications_for_deletelinks(
                deletes,
                NotificationType::MyMewUnlicked,
                feed_mew_hash,
            )?;
            all_notifications.append(&mut delete_notifications);

            Ok(all_notifications)
        }

        // HashToPinners
        (ZomeIndex(4), LinkType(1)) => {
            let feed_mew_hash = Some(ActionHash::from(create.base_address.clone()));

            let mut all_notifications = make_notifications_for_createlinks(
                vec![create],
                NotificationType::MyMewPinned,
                feed_mew_hash.clone(),
            )?;

            let mut delete_notifications = make_notifications_for_deletelinks(
                deletes,
                NotificationType::MyMewUnpinned,
                feed_mew_hash,
            )?;
            all_notifications.append(&mut delete_notifications);

            Ok(all_notifications)
        }

        (_, _) => Err(wasm_error!(WasmErrorInner::Guest(
            "Unexpected link type".into()
        ))),
    }
}

fn make_notifications_for_createlinks(
    create_link_actions: Vec<CreateLink>,
    notification_type: NotificationType,
    feed_mew_hash: Option<ActionHash>,
) -> ExternResult<Vec<Notification>> {
    let notifications: Vec<Notification> = create_link_actions
        .iter()
        .map(|create_action| -> ExternResult<Notification> {
            let agent_profile = get_agent_profile(create_action.author.clone())?;
            let feed_mew = match feed_mew_hash.clone() {
                Some(hash) => Some(get_mew_with_context(hash)?),
                None => None,
            };

            Ok(Notification {
                agent: create_action.author.clone(),
                agent_profile,
                timestamp: create_action.timestamp,
                notification_type: notification_type.clone(),
                feed_mew,
            })
        })
        .collect::<ExternResult<Vec<Notification>>>()?;

    Ok(notifications)
}

fn make_notifications_for_deletelinks(
    delete_link_actions: Vec<DeleteLink>,
    notification_type: NotificationType,
    feed_mew_hash: Option<ActionHash>,
) -> ExternResult<Vec<Notification>> {
    let notifications: Vec<Notification> = delete_link_actions
        .iter()
        .map(|delete_action| {
            let agent_profile = get_agent_profile(delete_action.author.clone())?;
            let feed_mew = match feed_mew_hash.clone() {
                Some(hash) => Some(get_mew_with_context(hash)?),
                None => None,
            };

            Ok(Notification {
                agent: delete_action.author.clone(),
                agent_profile,
                timestamp: delete_action.timestamp,
                notification_type: notification_type.clone(),
                feed_mew,
            })
        })
        .collect::<ExternResult<Vec<Notification>>>()?;

    Ok(notifications)
}

fn make_notifications_for_records(
    records: Vec<Record>,
    notification_type: NotificationType,
    include_feed_mew: bool,
) -> ExternResult<Vec<Notification>> {
    records
        .iter()
        .map(|record| -> ExternResult<Notification> {
            let agent_profile = get_agent_profile(record.action_hashed().author().clone())?;
            let feed_mew = match include_feed_mew {
                true => Some(get_mew_with_context(record.action_hashed().hash.clone())?),
                false => None,
            };

            Ok(Notification {
                agent: record.action_hashed().author().clone(),
                agent_profile,
                timestamp: record.action_hashed().timestamp(),
                notification_type: notification_type.clone(),
                feed_mew,
            })
        })
        .collect::<ExternResult<Vec<Notification>>>()
}

fn get_agent_profile(agent_pub_key: AgentPubKey) -> ExternResult<Option<Profile>> {
    let maybe_agent_profile_record = call_local_zome::<Option<Record>, AgentPubKey>(
        "profiles",
        "get_agent_profile",
        agent_pub_key,
    )?;

    match maybe_agent_profile_record {
        Some(agent_profile_record) => {
            let profile = agent_profile_record
                .entry()
                .to_app_option::<Profile>()
                .map_err(|e| wasm_error!(WasmErrorInner::Guest(e.into())))?
                .ok_or(wasm_error!(WasmErrorInner::Guest(String::from(
                    "Malformed profile"
                ))))?;

            Ok(Some(profile))
        }
        _ => Ok(None),
    }
}
