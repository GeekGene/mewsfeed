use hdk::prelude::*;
use chrono::{NaiveDateTime, DateTime, Utc};
use hc_time_index::IndexableEntry;
use mews_integrity::LinkTypes;

pub const TIME_INDEX_NAME: &str = "index_mews_by_timestamp";
pub const TIME_INDEX_LINK_TYPE: LinkTypes = LinkTypes::TimeIndexToMew;
pub const TIME_INDEX_PATH_LINK_TYPE: LinkTypes = LinkTypes::TimeIndex;

#[derive(Serialize, Deserialize, Debug, Clone, SerializedBytes)]
pub struct IndexableRecord {
    pub record_datetime: DateTime<Utc>,
    pub record_ah: ActionHash,
}

impl From<Record> for IndexableRecord {
  fn from(record: Record) -> Self {
      let record_timestamp = record.action().timestamp().as_seconds_and_nanos();
      let record_datetime = DateTime::<Utc>::from_utc(NaiveDateTime::from_timestamp(record_timestamp.0, record_timestamp.1), Utc);

      Self {
          record_ah: record.action_hashed().clone().hash,
          record_datetime,
      }
  }
}

impl IndexableEntry for IndexableRecord {
  fn entry_time(&self) -> DateTime<Utc> {
      self.record_datetime
  }

  fn hash(&self) -> ExternResult<AnyLinkableHash> {
      Ok(AnyLinkableHash::from(self.record_ah.clone()))
  }
}
