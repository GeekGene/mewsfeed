use crate::Direction;
use crate::Timestamped;
use hdk::prelude::*;
use std::cmp::Reverse;

#[derive(Serialize, Deserialize, SerializedBytes, Debug, Clone)]
pub struct TimestampPagination {
    pub after_timestamp: Option<Timestamp>,
    pub direction: Option<Direction>,
    pub limit: usize,
}

pub fn get_by_timestamp_pagination<T>(
    mut items: Vec<T>,
    page: Option<TimestampPagination>,
) -> ExternResult<Vec<T>>
where
    T: Clone + Timestamped,
{
    match page {
        Some(TimestampPagination {
            after_timestamp,
            limit,
            direction,
        }) => {
            // Sort items by timestamp() ascending or descending
            match direction {
                Some(Direction::Descending) => items.sort_by_key(|i| Reverse(i.timestamp())),
                Some(Direction::Ascending) => items.sort_by_key(|i| i.timestamp()),

                // Default to ascending
                None => items.sort_by_key(|i| i.timestamp()),
            }

            // Determine start index for page slice
            let start_index = match after_timestamp {
                Some(timestamp) => match items.iter().position(|l| l.timestamp() == timestamp) {
                    Some(prev_position) => prev_position + 1,
                    None => 0,
                },
                None => 0,
            };

            // Slice items into page by start index and limit
            let maybe_slice = match start_index + limit < items.len() {
                true => items.get(start_index..start_index + limit),
                false => items.get(start_index..items.len()),
            };

            match maybe_slice {
                Some(slice) => Ok(slice.to_vec()),
                None => Ok(vec![]),
            }
        }
        None => Ok(items),
    }
}
