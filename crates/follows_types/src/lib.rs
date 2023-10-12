use hc_link_pagination::AgentPubKeyPagination;
use hdk::prelude::*;

#[derive(Serialize, Deserialize, SerializedBytes, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct AddCreatorForFollowerInput {
    pub base_follower: AgentPubKey,
    pub target_creator: AgentPubKey,
}

#[derive(Serialize, Deserialize, SerializedBytes, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct GetCreatorsForFollowerInput {
    pub follower: AgentPubKey,
    pub page: Option<AgentPubKeyPagination>,
}

#[derive(Serialize, Deserialize, SerializedBytes, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct GetFollowersForCreatorInput {
    pub creator: AgentPubKey,
    pub page: Option<AgentPubKeyPagination>,
}

#[derive(Serialize, Deserialize, SerializedBytes, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct RemoveCreatorForFollowerInput {
    pub base_follower: AgentPubKey,
    pub target_creator: AgentPubKey,
}
