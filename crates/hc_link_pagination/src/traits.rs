use hdk::prelude::{AnyLinkableHash, Link, Timestamp};

pub trait Timestamped {
    fn timestamp(&self) -> Timestamp;
}

pub trait Hashed {
    fn hash(&self) -> AnyLinkableHash;
}

impl Hashed for Link {
    fn hash(&self) -> AnyLinkableHash {
        self.target.clone()
    }
}

impl Timestamped for Link {
    fn timestamp(&self) -> Timestamp {
        self.timestamp
    }
}
