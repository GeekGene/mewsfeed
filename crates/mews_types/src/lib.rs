use hdk::prelude::*;
use std::collections::BTreeMap;

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
}

#[derive(Serialize, Deserialize, SerializedBytes, Debug, Clone)]
pub struct EmbedMew {
    pub mew: Mew,
    pub action: Action,
    pub action_hash: ActionHash,
    pub author_profile: Option<Profile>,
    pub deleted_timestamp: Option<Timestamp>,
}
