use hdi::prelude::*;
use strum_macros::EnumIter;

#[derive(Serialize, Deserialize, SerializedBytes, Debug, Clone)]
pub struct DnaProperties {
    pub ranking_agents_count: usize,
    pub ranking_count: usize,
}

#[hdk_entry_defs]
#[unit_enum(UnitEntryTypes)]
pub enum EntryTypes {
    MewContent(MewContent),
    Mew(Mew),
}

#[hdk_entry_helper]
#[serde(rename_all = "camelCase")]
#[derive(Clone)]
pub enum MewType {
    Original,
    Reply(ActionHash),
    Quote(ActionHash),
    MewMew(ActionHash),
}

#[hdk_entry_helper]
#[derive(Clone)]
pub enum LinkTarget {
    Mention(AgentPubKey),
    URL(String),
}

#[derive(Debug, Serialize, Deserialize, SerializedBytes)]
#[serde(rename_all = "camelCase")]
pub struct CreateMewInput {
    pub mew_type: MewType,
    pub text: Option<String>,
    pub links: Option<Vec<LinkTarget>>,
}

#[hdk_entry_helper]
#[serde(rename_all = "camelCase")]
#[derive(Clone)]
pub struct MewContent {
    pub text: String,
    // "Visit this web site ^link by @user about #hashtag to earn $cashtag! Also read this humm earth post ^link (as an HRL link)"
    // [^links in the mewstring in sequence]
    pub links: Option<Vec<LinkTarget>>,
    // mew_images: Vec<EntryHash>, //Vec of image links hashes to retrieve
}

#[hdk_entry_helper]
#[serde(rename_all = "camelCase")]
#[derive(Clone)]
pub struct Mew {
    pub mew_type: MewType,
    pub content: Option<MewContent>,
}

#[hdk_entry_helper]
#[serde(rename_all = "camelCase")]
pub struct FeedOptions {
    pub option: String,
}

#[derive(Serialize, Deserialize, SerializedBytes, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FeedMew {
    pub mew: Mew,
    pub action: Action,
    pub action_hash: ActionHash,
    pub replies: Vec<AnyLinkableHash>,
    pub quotes: Vec<AnyLinkableHash>,
    pub licks: Vec<AgentPubKey>,
    pub mewmews: Vec<AnyLinkableHash>,
}

#[derive(Serialize, Deserialize, SerializedBytes, Debug, Clone)]
pub struct GetRecentMewsInput {
    pub count: u8,
    pub from_seconds_ago: u32,
}

#[derive(Serialize, Deserialize, SerializedBytes, Debug, Clone, EnumIter)]
pub enum MewRanking {
    MostLicks,
    MostReplies,
    MostQuotes,
    MostMewmews,
}

#[derive(Serialize, Deserialize, SerializedBytes, Debug, Clone)]
pub struct GetRankedMewsByYearInput {
    pub ranking_type: MewRanking,
    pub count: u32,
    pub year: u32,
}

#[derive(Serialize, Deserialize, SerializedBytes, Debug, Clone)]
pub struct GetRankedMewsByMonthInput {
    pub ranking_type: MewRanking,
    pub count: u32,
    pub year: u32,
    pub month: u32
}

#[derive(Serialize, Deserialize, SerializedBytes, Debug, Clone)]
pub struct GetRankedMewsByWeekInput {
    pub ranking_type: MewRanking,
    pub count: u32,
    pub year: u32,
    pub iso_week: u32
}

#[derive(Serialize, Deserialize, SerializedBytes, Debug, Clone)]
pub struct GetRankedMewsByDayInput {
    pub ranking_type: MewRanking,
    pub count: u32,
    pub year: u32,
    pub ordinal: u32
}

#[hdk_link_types]
pub enum LinkTypes {
    Mew,
    Follow,
    Lick,
    Reply,
    Mewmew,
    Quote,
    Tag,
    TagPrefix,
    TimeIndexToMew,
    TimeIndex,
    RankingIndexMewsMostLicks,
    RankingIndexMewsMostReplies,
    RankingIndexMewsMostQuotes,
    RankingIndexMewsMostMewmews
}

pub const MEW_PATH_SEGMENT: &str = "mew";
pub const FOLLOWER_PATH_SEGMENT: &str = "follower";
pub const FOLLOWING_PATH_SEGMENT: &str = "following";
pub const LICK_PATH_SEGMENT: &str = "lick";
pub const REPLY_PATH_SEGMENT: &str = "reply";
pub const MEWMEW_PATH_SEGMENT: &str = "mewmew";
pub const QUOTE_PATH_SEGMENT: &str = "quote";

#[hdk_extern]
pub fn validate(op: Op) -> ExternResult<ValidateCallbackResult> {
    match op.to_type::<EntryTypes, LinkTypes>().unwrap() {
        OpType::StoreEntry(entry) => match entry {
            OpEntry::CreateEntry { entry_type, .. } => match entry_type {
                EntryTypes::Mew(mew) => match mew.content {
                    None => Ok(ValidateCallbackResult::Valid),
                    Some(mew_content) => {
                        if mew_content.text.len() <= 200 {
                            Ok(ValidateCallbackResult::Valid)
                        } else {
                            Ok(ValidateCallbackResult::Invalid(
                                "mew must not be longer than 200 characters".to_string(),
                            ))
                        }
                    }
                },
                EntryTypes::MewContent(_) => Ok(ValidateCallbackResult::Valid),
            },
            _ => Ok(ValidateCallbackResult::Valid),
        },
        /* OpType::RegisterCreateLink { target_address, tag, link_type, .. } => match link_type {
            LinkTypes::RankingIndexMostLicks => {
                let record = must_get_valid_record(ActionHash::from(target_address))?;

                let _: Mew = record
                    .entry()
                    .to_app_option()
                    .unwrap()
                    .ok_or(wasm_error!(WasmErrorInner::Guest(String::from("Malformed mew"))))?;

                Ok(ValidateCallbackResult::Valid)
            }
            LinkTypes::RankingIndexMostReplies => {
                
                Ok(ValidateCallbackResult::Valid)
            }
            LinkTypes::RankingIndexMostQuotes => {
                
                Ok(ValidateCallbackResult::Valid)
            }
            LinkTypes::RankingIndexMostMewmews => {
                
                Ok(ValidateCallbackResult::Valid)
            }
            _ => Ok(ValidateCallbackResult::Valid),
        }*/
        _ => Ok(ValidateCallbackResult::Valid),
    }
}
