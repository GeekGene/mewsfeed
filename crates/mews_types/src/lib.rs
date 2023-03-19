use hc_link_pagination::Timestamped;
use hdk::prelude::*;
use std::collections::BTreeMap;

pub const FOLLOW_TOPIC: &str = "__FOLLOW__";

#[derive(Serialize, Deserialize, SerializedBytes, Debug, Clone, PartialEq, Eq)]
pub enum LinkTarget {
    Mention(AgentPubKey),
    Url(String),
    Record(ActionHash),
}

#[derive(Serialize, Deserialize, SerializedBytes, Debug, Clone, PartialEq, Eq)]
pub enum MewType {
    Original,
    Reply(ActionHash),
    Quote(ActionHash),
    Mewmew(ActionHash),
}

#[hdk_entry_helper]
#[derive(Clone, PartialEq, Eq)]
pub enum ResponseType {
    Reply,
    Quote,
    Mewmew,
}

#[hdk_entry_helper]
#[derive(Clone, PartialEq, Eq)]
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
    pub original_mew: Option<EmbedMew>,
    pub weight: Option<f32>,   // introduced with TrustAtoms
    pub topic: Option<String>, // introduced with TrustAtoms
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

impl Timestamped for Notification {
    fn timestamp(&self) -> Timestamp {
        self.timestamp
    }
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
