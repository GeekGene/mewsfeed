use hdk::prelude::*;
use chrono::{NaiveDateTime, DateTime, Utc};
use hc_time_index::IndexableEntry;
use mews_integrity::LinkTypes;

pub const TIME_INDEX_NAME: &str = "index_mews_by_timestamp";
pub const TIME_INDEX_LINK_TYPE: LinkTypes = LinkTypes::TimeIndexToMew;
pub const TIME_INDEX_PATH_LINK_TYPE: LinkTypes = LinkTypes::TimeIndex;

#[derive(Serialize, Deserialize, Debug, Clone, SerializedBytes)]
pub struct IndexableRecord(Record);

impl From<Record> for IndexableRecord {
    fn from(record: Record) -> Self {
        IndexableRecord(record)
    }
}

impl IndexableEntry for IndexableRecord {
    fn entry_time(&self) -> DateTime<Utc> {
        let record_timestamp = self.0.action().timestamp().as_seconds_and_nanos();
        let datetime = DateTime::<Utc>::from_utc(NaiveDateTime::from_timestamp(record_timestamp.0, record_timestamp.1), Utc);

        datetime
    }
  
    fn hash(&self) -> ExternResult<EntryHash> {
        let hash = EntryHash::from(self.0.action_hashed().entry_hash().unwrap().clone());

        Ok(hash)
    }
}
