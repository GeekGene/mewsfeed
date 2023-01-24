use std::hash::{Hash, Hasher};
use hdk::prelude::{Link, AnyLinkableHash};
use mews_integrity::{FeedMew, MewRanking};

pub struct DedupableLink(pub Link);

impl PartialEq for DedupableLink {
    fn eq(&self, other: &Self) -> bool {
        self.0.target == other.0.target
    }
}

impl Eq for DedupableLink {}

impl Hash for DedupableLink {
  fn hash<H: Hasher>(&self, state: &mut H) {
      self.0.hash(state);
  }
}

pub trait Rankable {
  fn hash(&self, item: FeedMew) -> AnyLinkableHash;
  fn score(&self, item: FeedMew) -> i64;
}

impl Rankable for MewRanking {
  fn hash(&self, item: FeedMew) -> AnyLinkableHash {
    AnyLinkableHash::from(item.action_hash)
  }

  fn score(&self, item: FeedMew) -> i64 {
    match &self {
      &MewRanking::MostLicks => item.licks.len().try_into().unwrap(),
      &MewRanking::MostReplies => item.replies.len().try_into().unwrap(),
      &MewRanking::MostMewmews => item.mewmews.len().try_into().unwrap(),
      &MewRanking::MostQuotes => item.quotes.len().try_into().unwrap(),
    }
  }
}
