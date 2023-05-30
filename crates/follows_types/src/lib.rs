use hdk::prelude::*;
use hc_link_pagination::{AgentPubKeyPagination};

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
