use hc_link_pagination::AgentPubKeyPagination;
use hdk::prelude::*;

#[derive(Serialize, Deserialize, SerializedBytes, Clone, Debug)]
pub struct AddCreatorForFollowerInput {
    pub base_follower: AgentPubKey,
    pub target_creator: AgentPubKey,
}

#[derive(Serialize, Deserialize, SerializedBytes, Clone, Debug)]
pub struct GetCreatorsForFollowerInput {
    pub follower: AgentPubKey,
    pub page: Option<AgentPubKeyPagination>,
}

#[derive(Serialize, Deserialize, SerializedBytes, Clone, Debug)]
pub struct GetFollowersForCreatorInput {
    pub creator: AgentPubKey,
    pub page: Option<AgentPubKeyPagination>,
}

#[derive(Serialize, Deserialize, SerializedBytes, Clone, Debug)]
pub struct RemoveCreatorForFollowerInput {
    pub base_follower: AgentPubKey,
    pub target_creator: AgentPubKey,
}

#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
pub struct FollowInput {
    pub agent: AgentPubKey,
    pub follow_topics: Vec<FollowTopicInput>,
}

#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
pub struct FollowTopicInput {
    pub topic: String,
    pub weight: String,
}

#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
pub struct TrustedFeedInput {
    pub agent: AgentPubKey,
    pub topic: String,
    pub weight: String,
}
