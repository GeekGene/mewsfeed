use hdk::prelude::*;

#[derive(Serialize, Deserialize, SerializedBytes, Debug, Clone)]
pub enum Direction {
    Ascending,
    Descending,
}
