use crate::agent_mews::get_agent_mews;
use crate::agent_mews::GetAgentMewsInput;
use crate::mew_to_responses::{get_responses_for_mew, GetResponsesForMewInput};
use crate::mew_with_context::get_mew_with_context;
use hc_call_utils::call_local_zome;
use hc_link_pagination::{paginate_by_timestamp, TimestampPagination};
use hdk::prelude::*;
use mews_types::{Mew, MewType, Notification, NotificationType, Profile};

#[derive(Serialize, Deserialize, SerializedBytes, Debug, Clone)]
pub struct GetNotificationsForAgentInput {
    agent: AgentPubKey,
    page: Option<TimestampPagination>,
}
#[hdk_extern]
pub fn get_notifications_for_agent(
    input: GetNotificationsForAgentInput,
) -> ExternResult<Vec<Notification>> {
    let agent_mews = get_agent_mews(GetAgentMewsInput {
        agent: input.agent.clone(),
        page: None,
    })?;

    let agent_link_details = get_link_details(
        input.agent.clone(),
        LinkTypeFilter::Types(vec![
            // Mentions of agent (MentionToMews)
            (ZomeIndex(1), vec![LinkType(6)]),
            // Follows of agent (CreatorToFollowers)
            (ZomeIndex(2), vec![LinkType(1)]),
        ]),
        None,
    )?;

    let mut all_link_details = agent_mews
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
                    if create.author == input.agent {
                        return Ok(vec!());
                    }

                    let deletes = delete_actions_hashed
                        .iter()
                        .filter(|action_hashed| *action_hashed.action().author() != input.agent)
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
    let mew_hashes_i_responded_to: Vec<(ActionHash, Record)> = agent_mews
        .iter()
        .filter_map(|record| match record.entry().to_app_option::<Mew>().ok() {
            Some(Some(mew)) => match mew.mew_type {
                MewType::Reply(ah) | MewType::Quote(ah) | MewType::Mewmew(ah) => {
                    Some((ah, record.clone()))
                }
                _ => None,
            },
            _ => None,
        })
        .collect();

    let mews_responding_to_mews_i_responded_to: Vec<(Record, Vec<Record>)> =
        mew_hashes_i_responded_to
            .iter()
            .map(|(ah, record)| {
                // Still have to use a get_links here because we cannot filter count_links by excluding an author
                let responses_result = get_responses_for_mew(GetResponsesForMewInput {
                    original_mew_hash: ah.clone(),
                    response_type: None,
                    page: None,
                });

                match responses_result {
                    Ok(responses) => Ok((record.clone(), responses)),
                    Err(e) => Err(e),
                }
            })
            .collect::<ExternResult<Vec<(Record, Vec<Record>)>>>()?;

    let mews_responding_to_mews_i_responded_to = mews_responding_to_mews_i_responded_to
        .iter()
        .flat_map(|(my_response, other_responses)| -> Vec<Record> {
            other_responses
                .iter()
                .filter(|other_response| {
                    other_response.action().author().clone() != input.agent.clone()
                        && other_response.action().timestamp() >= my_response.action().timestamp()
                })
                .cloned()
                .collect()
        })
        .collect();

    let mut n = make_notifications_for_records(
        mews_responding_to_mews_i_responded_to,
        NotificationType::FollowedYarnResponded,
        true,
    )?;
    notifications.append(&mut n);

    // All of this combined into one list sorted by timestamp descending
    let notifications_page = paginate_by_timestamp(notifications.clone(), input.page)?;

    Ok(notifications_page)
}

#[hdk_extern]
pub fn get_my_notifications(page: Option<TimestampPagination>) -> ExternResult<Vec<Notification>> {
    get_notifications_for_agent(GetNotificationsForAgentInput {
        agent: agent_info()?.agent_initial_pubkey,
        page,
    })
}

#[hdk_extern]
pub fn count_notifications_for_agent(agent: AgentPubKey) -> ExternResult<usize> {
    let agent_mews = get_agent_mews(GetAgentMewsInput {
        agent: agent.clone(),
        page: None,
    })?;

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

    let mut all_link_details = agent_mews
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

    let notifications_count: usize = all_link_details
        .iter()
        .map(|link_details| -> ExternResult<Vec<usize>> {
            link_details
                .clone()
                .into_inner()
                .iter()
                .map(
                    |(create_action_hashed, delete_actions_hashed)| -> ExternResult<usize> {
                        let create = match create_action_hashed.action() {
                            Action::CreateLink(a) => Ok(a.clone()),
                            _ => Err(wasm_error!(WasmErrorInner::Guest(
                                "Expected first element of LinkDetails to be CreateLink".into()
                            ))),
                        }?;
                        if create.author == agent {
                            return Ok(0);
                        }

                        let deletes = delete_actions_hashed
                            .iter()
                            .filter(|action_hashed| *action_hashed.action().author() != agent)
                            .map(|action_hashed| -> ExternResult<DeleteLink> {
                                match action_hashed.action() {
                                    Action::DeleteLink(a) => Ok(a.clone()),
                                    _ => Err(wasm_error!(WasmErrorInner::Guest(
                                        "Expected first element of LinkDetails to be CreateLink"
                                            .into()
                                    ))),
                                }
                            })
                            .collect::<ExternResult<Vec<DeleteLink>>>()?;

                        count_notifications(create, deletes)
                    },
                )
                .collect::<ExternResult<Vec<usize>>>()
        })
        .collect::<ExternResult<Vec<Vec<usize>>>>()?
        .iter()
        .flatten()
        .cloned()
        .sum();

    // Responses to Mews I have responded to
    let mew_hashes_i_responded_to: Vec<(ActionHash, Record)> = agent_mews
        .iter()
        .filter_map(|record| match record.entry().to_app_option::<Mew>().ok() {
            Some(Some(mew)) => match mew.mew_type {
                MewType::Reply(ah) | MewType::Quote(ah) | MewType::Mewmew(ah) => {
                    Some((ah, record.clone()))
                }
                _ => None,
            },
            _ => None,
        })
        .collect();

    let mews_responding_to_mews_i_responded_to: Vec<(Record, Vec<Record>)> =
        mew_hashes_i_responded_to
            .iter()
            .map(|(ah, record)| {
                // Still have to use a get_links here because we cannot filter count_links by excluding an author
                let responses_result = get_responses_for_mew(GetResponsesForMewInput {
                    original_mew_hash: ah.clone(),
                    response_type: None,
                    page: None,
                });

                match responses_result {
                    Ok(responses) => Ok((record.clone(), responses)),
                    Err(e) => Err(e),
                }
            })
            .collect::<ExternResult<Vec<(Record, Vec<Record>)>>>()?;

    let mews_responding_to_mews_i_responded_to_count = mews_responding_to_mews_i_responded_to
        .iter()
        .flat_map(|(my_response, other_responses)| -> Vec<Record> {
            other_responses
                .iter()
                .filter(|other_response| {
                    other_response.action().author().clone() != agent.clone()
                        && other_response.action().timestamp() >= my_response.action().timestamp()
                })
                .cloned()
                .collect()
        })
        .count();

    Ok(notifications_count + mews_responding_to_mews_i_responded_to_count)
}

#[hdk_extern]
pub fn count_my_notifications(_: ()) -> ExternResult<usize> {
    count_notifications_for_agent(agent_info()?.agent_initial_pubkey)
}

fn count_notifications(create: CreateLink, deletes: Vec<DeleteLink>) -> ExternResult<usize> {
    match (create.zome_index, create.link_type) {
        // MentionToMews
        (ZomeIndex(1), LinkType(6)) => Ok(1),

        // CreatorToFollowers
        (ZomeIndex(2), LinkType(1)) => Ok(1 + deletes.len()),

        // MewToResponses
        (ZomeIndex(1), LinkType(5)) => Ok(1),

        // HashToLikers
        (ZomeIndex(3), LinkType(1)) => Ok(1 + deletes.len()),

        // HashToPinners
        (ZomeIndex(4), LinkType(1)) => Ok(1 + deletes.len()),

        (_, _) => Err(wasm_error!(WasmErrorInner::Guest(
            "Unexpected link type".into()
        ))),
    }
}

fn make_notifications(
    create: CreateLink,
    deletes: Vec<DeleteLink>,
) -> ExternResult<Vec<Notification>> {
    match (create.zome_index, create.link_type) {
        // MentionToMews
        (ZomeIndex(1), LinkType(6)) => {
            let feed_mew_hash = Some(
                ActionHash::try_from(create.target_address.clone())
                    .map_err(|err| wasm_error!(err))?,
            );

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
            let feed_mew_hash = Some(
                ActionHash::try_from(create.target_address.clone())
                    .map_err(|err| wasm_error!(err))?,
            );

            make_notifications_for_createlinks(
                vec![create],
                NotificationType::MyMewResponded,
                feed_mew_hash,
            )
        }

        // HashToLikers
        (ZomeIndex(3), LinkType(1)) => {
            let feed_mew_hash = Some(
                ActionHash::try_from(create.base_address.clone())
                    .map_err(|err| wasm_error!(err))?,
            );

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
            let feed_mew_hash = Some(
                ActionHash::try_from(create.base_address.clone())
                    .map_err(|err| wasm_error!(err))?,
            );

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
