use hdk::prelude::*;
use std::collections::BTreeMap;

#[derive(Serialize, Deserialize, SerializedBytes, Debug, Clone, PartialEq)]
pub enum LinkTarget {
    Mention(AgentPubKey),
    Url(String),
    Record(ActionHash),
}

#[derive(Serialize, Deserialize, SerializedBytes, Debug, Clone, PartialEq)]
pub enum MewType {
    Original,
    Reply(ActionHash),
    Quote(ActionHash),
    Mewmew(ActionHash),
}

#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
pub enum ResponseType {
    Reply,
    Quote,
    Mewmew,
}

#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
pub struct Mew {
    pub text: String,
    pub links: Vec<LinkTarget>,
    pub mew_type: MewType,
}

#[derive(Serialize, Deserialize, SerializedBytes, Debug, Clone)]
pub struct Profile {
    pub nickname: String,
    pub fields: BTreeMap<String, String>,
}

#[derive(Serialize, Deserialize, SerializedBytes, Debug, Clone)]
pub struct FeedMew {
    pub mew: Mew,
    pub action: Action,
    pub action_hash: ActionHash,
    pub replies: Vec<ActionHash>,
    pub quotes: Vec<ActionHash>,
    pub licks: Vec<AgentPubKey>,
    pub mewmews: Vec<ActionHash>,
    pub deleted_timestamp: Option<Timestamp>,
    pub author_profile: Option<Profile>,
    pub is_pinned: bool,
    pub original_mew: Option<EmbedMew>
}

#[derive(Serialize, Deserialize, SerializedBytes, Debug, Clone)]
pub struct EmbedMew {
    pub mew: Mew,
    pub action: Action,
    pub action_hash: ActionHash,
    pub author_profile: Option<Profile>,
    pub deleted_timestamp: Option<Timestamp>,
}

#[derive(Serialize, Deserialize, SerializedBytes, Debug, Clone)]
pub struct Notification {
    pub notification_type: NotificationType,
    pub timestamp: Timestamp,
    pub agent: AgentPubKey,
    pub agent_profile: Option<Profile>,
    pub feed_mew: Option<FeedMew>,
}

#[derive(Serialize, Deserialize, SerializedBytes, Debug, Clone)]
pub enum NotificationType {
    MyMewLicked,
    MyMewUnlicked,
    MyMewPinned,
    MyMewUnpinned,
    MyMewResponded,
    MyAgentMentioned,
    MyAgentFollowed,
    MyAgentUnfollowed,
    FollowedYarnResponded,
}
