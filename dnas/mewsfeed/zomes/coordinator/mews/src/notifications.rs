use crate::agent_mews::get_agent_mews;
use crate::mention_to_mews::get_mews_for_mention;
use crate::mew_to_responses::{get_responses_for_mew, GetResponsesForMewInput};
use crate::mew_with_context::get_mew_with_context;
use hc_call_utils::call_local_zome;
use hdk::prelude::*;
use mews_types::{Mew, MewType, Notification, NotificationType, Profile};
use std::cmp::Reverse;

#[hdk_extern]
pub fn get_notifications_for_agent(agent: AgentPubKey) -> ExternResult<Vec<Notification>> {
    let my_mews = get_agent_mews(agent.clone())?;
    let mut notifications = vec![];

    // Mews that mention my profile
    let mews_records: Vec<Record> = get_mews_for_mention(agent.clone())?;
    let mut n =
        make_notifications_for_records(mews_records, NotificationType::MyAgentMentioned, false)?;
    notifications.append(&mut n);

    // Follows of my agent
    let followed_my_mews_linkdetails: LinkDetails = call_local_zome::<LinkDetails, AgentPubKey>(
        "follows",
        "get_follower_link_details_for_creator",
        agent.clone(),
    )?;

    let follow_create_actions =
        get_creates_from_linkdetails(vec![followed_my_mews_linkdetails.clone()])?;
    let mut n: Vec<Notification> = make_notifications_for_createlinks(
        follow_create_actions,
        NotificationType::MyAgentFollowed,
        false,
    )?;
    notifications.append(&mut n);

    // Unfollows of my agent
    let follow_delete_actions = get_deletes_from_linkdetails(vec![followed_my_mews_linkdetails])?;
    let mut n: Vec<Notification> = make_notifications_for_deletelinks(
        follow_delete_actions,
        NotificationType::MyAgentUnfollowed,
        false,
    )?;
    notifications.append(&mut n);

    // Pins of my Mews
    let pinned_my_mews_linkdetails: Vec<LinkDetails> = my_mews
        .iter()
        .map(|m| {
            call_local_zome::<LinkDetails, ActionHash>(
                "agent_pins",
                "get_pinner_link_details_for_hash",
                m.action_hashed().hash.clone(),
            )
        })
        .collect::<ExternResult<Vec<LinkDetails>>>()?;

    let pin_create_actions = get_creates_from_linkdetails(pinned_my_mews_linkdetails.clone())?;
    let mut n: Vec<Notification> = make_notifications_for_createlinks(
        pin_create_actions,
        NotificationType::MyMewPinned,
        true,
    )?;
    notifications.append(&mut n);

    // Unpins of my mews
    let pin_delete_actions = get_deletes_from_linkdetails(pinned_my_mews_linkdetails)?;
    let mut n: Vec<Notification> = make_notifications_for_deletelinks(
        pin_delete_actions,
        NotificationType::MyMewUnpinned,
        true,
    )?;
    notifications.append(&mut n);

    // Licks of my Mews
    let licked_my_mews_linkdetails: Vec<LinkDetails> = my_mews
        .iter()
        .map(|m| {
            call_local_zome::<LinkDetails, ActionHash>(
                "likes",
                "get_liker_link_details_for_hash",
                m.action_hashed().hash.clone(),
            )
        })
        .collect::<ExternResult<Vec<LinkDetails>>>()?;

    let lick_create_actions = get_creates_from_linkdetails(licked_my_mews_linkdetails.clone())?;
    let mut n: Vec<Notification> = make_notifications_for_createlinks(
        lick_create_actions,
        NotificationType::MyMewLicked,
        true,
    )?;
    notifications.append(&mut n);

    // Unlicks of my mews
    let lick_delete_actions = get_deletes_from_linkdetails(licked_my_mews_linkdetails)?;
    let mut n: Vec<Notification> = make_notifications_for_deletelinks(
        lick_delete_actions,
        NotificationType::MyMewUnlicked,
        true,
    )?;
    notifications.append(&mut n);

    // Responses to my Mews
    let mews_mentioning_me = my_mews
        .iter()
        .map(|m| {
            get_responses_for_mew(GetResponsesForMewInput {
                original_mew_hash: m.action_hashed().hash.clone(),
                response_type: None,
            })
        })
        .collect::<ExternResult<Vec<Vec<Record>>>>()?
        .iter()
        .flatten()
        .cloned()
        .collect::<Vec<Record>>();

    let mut n =
        make_notifications_for_records(mews_mentioning_me, NotificationType::MyMewResponded, true)?;
    notifications.append(&mut n);

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

fn get_deletes_from_linkdetails(linkdetails: Vec<LinkDetails>) -> ExternResult<Vec<DeleteLink>> {
    let linkdetails_deletes: Vec<DeleteLink> = linkdetails
        .iter()
        .map(|linkdetail| -> ExternResult<Vec<SignedHashed<Action>>> {
            let linkdetails_inner = linkdetail.clone().into_inner();
            match linkdetails_inner.first() {
                Some((_, delete_actions_hashed)) => Ok(delete_actions_hashed.clone()),
                None => Ok(vec![]),
            }
        })
        .collect::<ExternResult<Vec<Vec<SignedHashed<Action>>>>>()?
        .iter()
        .flatten()
        .cloned()
        .filter_map(|action_hashed| match action_hashed.action() {
            Action::DeleteLink(delete_link_action) => Some(delete_link_action.clone()),
            _ => None,
        })
        .collect();

    Ok(linkdetails_deletes)
}

fn get_creates_from_linkdetails(linkdetails: Vec<LinkDetails>) -> ExternResult<Vec<CreateLink>> {
    let create_actions: Vec<CreateLink> = linkdetails
        .iter()
        .flat_map(|linkdetail| -> Vec<SignedHashed<Action>> {
            let linkdetails_inner = linkdetail.clone().into_inner();

            linkdetails_inner
                .iter()
                .map(|l| l.clone().0)
                .collect::<Vec<SignedHashed<Action>>>()
        })
        .filter_map(|action_hashed| match action_hashed.action() {
            Action::CreateLink(create_link_action) => Some(create_link_action.clone()),
            _ => None,
        })
        .collect();

    Ok(create_actions)
}

fn make_notifications_for_createlinks(
    create_link_actions: Vec<CreateLink>,
    notification_type: NotificationType,
    include_feed_mew: bool,
) -> ExternResult<Vec<Notification>> {
    let notifications: Vec<Notification> = create_link_actions
        .iter()
        .map(|create_action| -> ExternResult<Notification> {
            let agent_profile = get_agent_profile(create_action.author.clone())?;
            let feed_mew = match include_feed_mew {
                true => Some(get_mew_with_context(ActionHash::from(
                    create_action.base_address.clone(),
                ))?),
                false => None,
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
    include_feed_mew: bool,
) -> ExternResult<Vec<Notification>> {
    let notifications: Vec<Notification> = delete_link_actions
        .iter()
        .map(|delete_action| {
            let agent_profile = get_agent_profile(delete_action.author.clone())?;
            let feed_mew = match include_feed_mew {
                true => Some(get_mew_with_context(ActionHash::from(
                    delete_action.base_address.clone(),
                ))?),
                false => None,
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
