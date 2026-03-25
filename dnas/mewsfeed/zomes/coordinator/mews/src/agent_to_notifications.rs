use crate::agent_mews::get_agent_mews;
use crate::agent_mews::GetAgentMewsInput;
use crate::mew_to_responses::{get_responses_for_mew, GetResponsesForMewInput};
use crate::mew_with_context::get_mew_with_context_internal;
use hc_link_pagination::{paginate_by_timestamp, TimestampPagination};
use hc_zome_input::ZomeFnInput;
use hdk::prelude::*;
use mews_types::{Mew, MewType, Notification, NotificationType};

// Link type identifiers matching the merged mews_integrity::LinkTypes enum ordinals.
// Integrity zome order in dna.yaml:
//   0: profiles_integrity
//   1: mews_integrity (all link types merged here)
const MEWS_ZOME_INDEX: ZomeIndex = ZomeIndex(1);

const MEW_TO_RESPONSES_LINK_TYPE: LinkType = LinkType(5);
const MENTION_TO_MEWS_LINK_TYPE: LinkType = LinkType(6);
const CREATOR_TO_FOLLOWERS_LINK_TYPE: LinkType = LinkType(10);
const HASH_TO_LIKERS_LINK_TYPE: LinkType = LinkType(12);
const HASH_TO_PINNERS_LINK_TYPE: LinkType = LinkType(14);

#[derive(Serialize, Deserialize, SerializedBytes, Debug, Clone)]
pub struct GetNotificationsForAgentInput {
    pub agent: AgentPubKey,
    pub page: Option<TimestampPagination>,
}
#[hdk_extern]
pub fn get_notifications_for_agent(
    input: ZomeFnInput<GetNotificationsForAgentInput>,
) -> ExternResult<Vec<Notification>> {
    let strategy = input.get_strategy();
    let get_options = input.get_options();
    let agent_mews = get_agent_mews(ZomeFnInput::new(
        GetAgentMewsInput {
            agent: input.input.agent.clone(),
            page: None,
        },
        Some(strategy == GetStrategy::Local),
    ))?;

    let agent_link_details = match get_links_details(
        LinkQuery::new(
            AnyLinkableHash::from(input.input.agent.clone()),
            LinkTypeFilter::Types(vec![
                (MEWS_ZOME_INDEX, vec![MENTION_TO_MEWS_LINK_TYPE]),
                (MEWS_ZOME_INDEX, vec![CREATOR_TO_FOLLOWERS_LINK_TYPE]),
            ]),
        ),
        strategy,
    ) {
        Ok(details) => Some(details),
        Err(e) => {
            debug!("Skipping unavailable agent link details: {:?}", e);
            None
        }
    };

    let mut all_link_details: Vec<LinkDetails> = agent_mews
        .iter()
        .filter_map(|mew| {
            match get_links_details(
                LinkQuery::new(
                    AnyLinkableHash::from(mew.action_hashed().hash.clone()),
                    LinkTypeFilter::Types(vec![
                        (MEWS_ZOME_INDEX, vec![MEW_TO_RESPONSES_LINK_TYPE]),
                        (MEWS_ZOME_INDEX, vec![HASH_TO_LIKERS_LINK_TYPE]),
                        (MEWS_ZOME_INDEX, vec![HASH_TO_PINNERS_LINK_TYPE]),
                    ]),
                ),
                strategy,
            ) {
                Ok(details) => Some(details),
                Err(e) => {
                    debug!(
                        "Skipping unavailable mew link details {:?}: {:?}",
                        mew.action_hashed().hash,
                        e
                    );
                    None
                }
            }
        })
        .collect();

    if let Some(details) = agent_link_details {
        if !details.clone().into_inner().is_empty() {
            all_link_details.push(details);
        }
    }

    let agent = input.input.agent.clone();
    let mut notifications: Vec<Notification> = all_link_details
        .iter()
        .flat_map(|link_details| {
            link_details.clone().into_inner().into_iter().filter_map(
                |(create_action_hashed, delete_actions_hashed)| {
                    let create = match create_action_hashed.action() {
                        Action::CreateLink(a) => a.clone(),
                        _ => {
                            debug!("Skipping non-CreateLink action in link details");
                            return None;
                        }
                    };
                    if create.author == agent {
                        return Some(vec![]);
                    }

                    let deletes: Vec<DeleteLink> = delete_actions_hashed
                        .iter()
                        .filter(|action_hashed| *action_hashed.action().author() != agent)
                        .filter_map(|action_hashed| match action_hashed.action() {
                            Action::DeleteLink(a) => Some(a.clone()),
                            _ => {
                                debug!("Skipping non-DeleteLink action in link details");
                                None
                            }
                        })
                        .collect();

                    make_notifications(create, deletes, get_options.clone()).ok()
                },
            )
        })
        .flatten()
        .collect();

    // Responses to Mews I have responded to
    let mut mew_hashes_i_responded_to: Vec<(Record, ActionHash)> = agent_mews
        .iter()
        // Filter only mew types that are responses
        .filter_map(
            |response_record| match response_record.entry().to_app_option::<Mew>().ok() {
                Some(Some(mew)) => match mew.mew_type {
                    MewType::Reply(original_ah)
                    | MewType::Quote(original_ah)
                    | MewType::Mewmew(original_ah) => Some((response_record.clone(), original_ah)),
                    _ => None,
                },
                _ => None,
            },
        )
        // Exclude responses to agent's mews to avoid duplicate notifications for both "responded to your mew" and "responded to a yarn you participated in"
        .filter(|(_, original_ah)| {
            agent_mews
                .iter()
                .filter(|authored_record| {
                    authored_record.action_hashed().hash == original_ah.clone()
                })
                .count()
                == 0
        })
        .collect();
    mew_hashes_i_responded_to
        .sort_by_key(|(response_record, _)| response_record.action().timestamp());
    mew_hashes_i_responded_to.dedup_by_key(|(_, original_ah)| original_ah.clone());

    let mews_responding_to_mews_i_responded_to: Vec<(Record, Vec<Record>)> =
        mew_hashes_i_responded_to
            .iter()
            .filter_map(|(my_response, original_ah)| {
                // Still have to use a get_links here because we cannot filter count_links by excluding an author
                match get_responses_for_mew(ZomeFnInput::new(
                    GetResponsesForMewInput {
                        original_mew_hash: original_ah.clone(),
                        response_type: None,
                        page: None,
                    },
                    Some(strategy == GetStrategy::Local),
                )) {
                    Ok(all_responses) => Some((my_response.clone(), all_responses)),
                    Err(e) => {
                        debug!(
                            "Skipping unavailable responses for mew {:?}: {:?}",
                            original_ah, e
                        );
                        None
                    }
                }
            })
            .collect();

    let mews_responding_to_mews_i_responded_to = mews_responding_to_mews_i_responded_to
        .iter()
        .flat_map(|(my_response, all_responses)| -> Vec<Record> {
            all_responses
                .iter()
                .filter(|other_response| {
                    other_response.action().author().clone() != agent.clone()
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
        get_options,
    )?;
    notifications.append(&mut n);

    // All of this combined into one list sorted by timestamp descending
    let notifications_page = paginate_by_timestamp(notifications.clone(), input.input.page)?;

    Ok(notifications_page)
}

#[hdk_extern]
pub fn get_my_notifications(
    input: ZomeFnInput<Option<TimestampPagination>>,
) -> ExternResult<Vec<Notification>> {
    let local = Some(input.get_strategy() == GetStrategy::Local);
    get_notifications_for_agent(ZomeFnInput::new(
        GetNotificationsForAgentInput {
            agent: agent_info()?.agent_initial_pubkey,
            page: input.input,
        },
        local,
    ))
}

#[hdk_extern]
pub fn count_notifications_for_agent(input: ZomeFnInput<AgentPubKey>) -> ExternResult<usize> {
    let strategy = input.get_strategy();
    let agent = input.input;
    let agent_mews = get_agent_mews(ZomeFnInput::new(
        GetAgentMewsInput {
            agent: agent.clone(),
            page: None,
        },
        Some(strategy == GetStrategy::Local),
    ))?;

    let agent_link_details = match get_links_details(
        LinkQuery::new(
            AnyLinkableHash::from(agent.clone()),
            LinkTypeFilter::Types(vec![
                (MEWS_ZOME_INDEX, vec![MENTION_TO_MEWS_LINK_TYPE]),
                (MEWS_ZOME_INDEX, vec![CREATOR_TO_FOLLOWERS_LINK_TYPE]),
            ]),
        ),
        strategy,
    ) {
        Ok(details) => Some(details),
        Err(e) => {
            debug!("Skipping unavailable agent link details: {:?}", e);
            None
        }
    };

    let mut all_link_details: Vec<LinkDetails> = agent_mews
        .iter()
        .filter_map(|mew| {
            match get_links_details(
                LinkQuery::new(
                    AnyLinkableHash::from(mew.action_hashed().hash.clone()),
                    LinkTypeFilter::Types(vec![
                        (MEWS_ZOME_INDEX, vec![MEW_TO_RESPONSES_LINK_TYPE]),
                        (MEWS_ZOME_INDEX, vec![HASH_TO_LIKERS_LINK_TYPE]),
                        (MEWS_ZOME_INDEX, vec![HASH_TO_PINNERS_LINK_TYPE]),
                    ]),
                ),
                strategy,
            ) {
                Ok(details) => Some(details),
                Err(e) => {
                    debug!(
                        "Skipping unavailable mew link details {:?}: {:?}",
                        mew.action_hashed().hash,
                        e
                    );
                    None
                }
            }
        })
        .collect();

    if let Some(details) = agent_link_details {
        if !details.clone().into_inner().is_empty() {
            all_link_details.push(details);
        }
    }

    let notifications_count: usize = all_link_details
        .iter()
        .flat_map(|link_details| {
            link_details.clone().into_inner().into_iter().filter_map(
                |(create_action_hashed, delete_actions_hashed)| {
                    let create = match create_action_hashed.action() {
                        Action::CreateLink(a) => a.clone(),
                        _ => {
                            debug!("Skipping non-CreateLink action in link details");
                            return None;
                        }
                    };
                    if create.author == agent {
                        return Some(0);
                    }

                    let deletes: Vec<DeleteLink> = delete_actions_hashed
                        .iter()
                        .filter(|action_hashed| *action_hashed.action().author() != agent)
                        .filter_map(|action_hashed| match action_hashed.action() {
                            Action::DeleteLink(a) => Some(a.clone()),
                            _ => {
                                debug!("Skipping non-DeleteLink action in link details");
                                None
                            }
                        })
                        .collect();

                    count_notifications(create, deletes).ok()
                },
            )
        })
        .sum();

    // Responses to Mews I have responded to
    let mut mew_hashes_i_responded_to: Vec<(Record, ActionHash)> = agent_mews
        .iter()
        .filter_map(
            |response_record| match response_record.entry().to_app_option::<Mew>().ok() {
                Some(Some(mew)) => match mew.mew_type {
                    MewType::Reply(original_ah)
                    | MewType::Quote(original_ah)
                    | MewType::Mewmew(original_ah) => Some((response_record.clone(), original_ah)),
                    _ => None,
                },
                _ => None,
            },
        )
        .filter(|(_, original_ah)| {
            agent_mews
                .iter()
                .filter(|authored_record| {
                    authored_record.action_hashed().hash == original_ah.clone()
                })
                .count()
                == 0
        })
        .collect();
    mew_hashes_i_responded_to
        .sort_by_key(|(response_record, _)| response_record.action().timestamp());
    mew_hashes_i_responded_to.dedup_by_key(|(_, original_ah)| original_ah.clone());

    let mews_responding_to_mews_i_responded_to: Vec<(Record, Vec<Record>)> =
        mew_hashes_i_responded_to
            .iter()
            .filter_map(|(my_response, original_ah)| {
                // Still have to use a get_links here because we cannot filter count_links by excluding an author
                match get_responses_for_mew(ZomeFnInput::new(
                    GetResponsesForMewInput {
                        original_mew_hash: original_ah.clone(),
                        response_type: None,
                        page: None,
                    },
                    Some(strategy == GetStrategy::Local),
                )) {
                    Ok(all_responses) => Some((my_response.clone(), all_responses)),
                    Err(e) => {
                        debug!(
                            "Skipping unavailable responses for mew {:?}: {:?}",
                            original_ah, e
                        );
                        None
                    }
                }
            })
            .collect();

    let mews_responding_to_mews_i_responded_to_count = mews_responding_to_mews_i_responded_to
        .iter()
        .flat_map(|(my_response, all_responses)| -> Vec<Record> {
            all_responses
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
pub fn count_my_notifications(input: ZomeFnInput<()>) -> ExternResult<usize> {
    count_notifications_for_agent(ZomeFnInput::new(
        agent_info()?.agent_initial_pubkey,
        Some(input.get_strategy() == GetStrategy::Local),
    ))
}

fn count_notifications(create: CreateLink, deletes: Vec<DeleteLink>) -> ExternResult<usize> {
    match (create.zome_index, create.link_type) {
        (MEWS_ZOME_INDEX, MENTION_TO_MEWS_LINK_TYPE) => Ok(1),
        (MEWS_ZOME_INDEX, CREATOR_TO_FOLLOWERS_LINK_TYPE) => Ok(1 + deletes.len()),
        (MEWS_ZOME_INDEX, MEW_TO_RESPONSES_LINK_TYPE) => Ok(1),
        (MEWS_ZOME_INDEX, HASH_TO_LIKERS_LINK_TYPE) => Ok(1 + deletes.len()),
        (MEWS_ZOME_INDEX, HASH_TO_PINNERS_LINK_TYPE) => Ok(1 + deletes.len()),
        (_, _) => Err(wasm_error!(WasmErrorInner::Guest(
            "Unexpected link type".into()
        ))),
    }
}

fn make_notifications(
    create: CreateLink,
    deletes: Vec<DeleteLink>,
    get_options: GetOptions,
) -> ExternResult<Vec<Notification>> {
    match (create.zome_index, create.link_type) {
        (MEWS_ZOME_INDEX, MENTION_TO_MEWS_LINK_TYPE) => {
            let feed_mew_hash = Some(
                ActionHash::try_from(create.target_address.clone())
                    .map_err(|err| wasm_error!(err))?,
            );

            make_notifications_for_createlinks(
                vec![create],
                NotificationType::MyAgentMentioned,
                feed_mew_hash,
                get_options,
            )
        }

        (MEWS_ZOME_INDEX, CREATOR_TO_FOLLOWERS_LINK_TYPE) => {
            let mut all_notifications = make_notifications_for_createlinks(
                vec![create],
                NotificationType::MyAgentFollowed,
                None,
                get_options.clone(),
            )?;

            let mut delete_notifications = make_notifications_for_deletelinks(
                deletes,
                NotificationType::MyAgentUnfollowed,
                None,
                get_options,
            )?;
            all_notifications.append(&mut delete_notifications);

            Ok(all_notifications)
        }

        (MEWS_ZOME_INDEX, MEW_TO_RESPONSES_LINK_TYPE) => {
            let feed_mew_hash = Some(
                ActionHash::try_from(create.target_address.clone())
                    .map_err(|err| wasm_error!(err))?,
            );

            make_notifications_for_createlinks(
                vec![create],
                NotificationType::MyMewResponded,
                feed_mew_hash,
                get_options,
            )
        }

        (MEWS_ZOME_INDEX, HASH_TO_LIKERS_LINK_TYPE) => {
            let feed_mew_hash = Some(
                ActionHash::try_from(create.base_address.clone())
                    .map_err(|err| wasm_error!(err))?,
            );

            let mut all_notifications = make_notifications_for_createlinks(
                vec![create],
                NotificationType::MyMewLicked,
                feed_mew_hash.clone(),
                get_options.clone(),
            )?;

            let mut delete_notifications = make_notifications_for_deletelinks(
                deletes,
                NotificationType::MyMewUnlicked,
                feed_mew_hash,
                get_options,
            )?;
            all_notifications.append(&mut delete_notifications);

            Ok(all_notifications)
        }

        (MEWS_ZOME_INDEX, HASH_TO_PINNERS_LINK_TYPE) => {
            let feed_mew_hash = Some(
                ActionHash::try_from(create.base_address.clone())
                    .map_err(|err| wasm_error!(err))?,
            );

            let mut all_notifications = make_notifications_for_createlinks(
                vec![create],
                NotificationType::MyMewPinned,
                feed_mew_hash.clone(),
                get_options.clone(),
            )?;

            let mut delete_notifications = make_notifications_for_deletelinks(
                deletes,
                NotificationType::MyMewUnpinned,
                feed_mew_hash,
                get_options,
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
    get_options: GetOptions,
) -> ExternResult<Vec<Notification>> {
    let notifications: Vec<Notification> = create_link_actions
        .iter()
        .map(|create_action| -> ExternResult<Notification> {
            let feed_mew = match feed_mew_hash.clone() {
                Some(hash) => Some(get_mew_with_context_internal(hash, get_options.clone())?),
                None => None,
            };

            Ok(Notification {
                agent: create_action.author.clone(),
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
    get_options: GetOptions,
) -> ExternResult<Vec<Notification>> {
    let notifications: Vec<Notification> = delete_link_actions
        .iter()
        .map(|delete_action| {
            let feed_mew = match feed_mew_hash.clone() {
                Some(hash) => Some(get_mew_with_context_internal(hash, get_options.clone())?),
                None => None,
            };

            Ok(Notification {
                agent: delete_action.author.clone(),
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
    get_options: GetOptions,
) -> ExternResult<Vec<Notification>> {
    records
        .iter()
        .map(|record| -> ExternResult<Notification> {
            let feed_mew = match include_feed_mew {
                true => Some(get_mew_with_context_internal(
                    record.action_hashed().hash.clone(),
                    get_options.clone(),
                )?),
                false => None,
            };

            Ok(Notification {
                agent: record.action_hashed().author().clone(),
                timestamp: record.action_hashed().timestamp(),
                notification_type: notification_type.clone(),
                feed_mew,
            })
        })
        .collect::<ExternResult<Vec<Notification>>>()
}
