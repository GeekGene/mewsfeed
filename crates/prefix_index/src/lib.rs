//! Holochain Prefix Index
//!
//! A crate for prefix indexing of labelled hashes
//!
//! Useful for type-ahead "search" or autocomplete features.
use hdk::prelude::*;
pub mod prefix_index_to_hashes;
pub use prefix_index_to_hashes::*;
pub mod validate;
use lazy_static::lazy_static;
pub use validate::*;

/// Configuration object that should be set in your host DNA's properties
#[derive(Serialize, Deserialize, Debug, SerializedBytes)]
pub struct DnaProperties {
    pub prefix_index_width: usize,
}

// Parse configuration & setup library constants
lazy_static! {
    pub static ref PREFIX_INDEX_WIDTH: usize = {
        let dna_properties = dna_info()
            .expect("Could not get zome configuration")
            .properties;
        let properties = DnaProperties::try_from(dna_properties)
        .expect("Unable to parse index config from DNA properties. Please specify prefix index size integer via 'prefix_index_width' DNA property.");

        properties.prefix_index_width
    };
}
