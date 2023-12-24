#![warn(warnings)]

use futures::future::join_all;
use serial_test::serial;

use hdk::prelude::*;
use holochain::conductor::config::ConductorConfig;
use holochain::sweettest::{
    SweetAgents, SweetAppBatch, SweetCell, SweetConductor, SweetConductorBatch, SweetDnaFile,
    SweetZome,
};
use holochain::test_utils::consistency_10s;

use trust_atom_types::{QueryInput, TrustAtom};

use follows::follower_to_creators::{FollowInput, FollowTopicInput, TrustedFeedInput};
use mews_types::{FeedMew, Mew, MewType};

const DNA_FILEPATH: &str = "../../../workdir/mewsfeed.dna";
const MEWS_ZOME_NAME: &str = "mews";
const FOLLOWS_ZOME_NAME: &str = "follows";
const TRUST_ATOM_ZOME_NAME: &str = "trust_atom";

// Map of Follows for convenience calculations:
// Ann -> Bob in HC 0.5
// Ann -> Cat in HC 1.0
// Ann -> Dave in HC 0.25
// Ann -> Bob in BC 0.1
// Ann -> Cat in BC 0
// Ann -> Dave in BC 0.55
//
// Feed order should be:
// HC
// Cat,Bob,Dave
// BC
// Dave,Bob (Cat excluded because of 0 value)

#[tokio::test(flavor = "multi_thread")]
#[serial]
async fn trusted_feed_based_on_follow_topics_ordered_by_weight() {
    let mut agent_group = setup().await;
    let agents = agent_group.create_agents().await;

    let ann = &agents[0]; // Ann is the testing agent
    let bob = &agents[1];
    let cat = &agents[2];
    let dave = &agents[3];
    // let emma = &agents[4];
    // let frank = &agents[5];

    // FOLLOWS //

    // #Holochain

    ann.follow(FollowInput {
        agent: bob.pubkey.clone(),
        follow_topics: vec![FollowTopicInput {
            topic: String::from("holochain"),
            weight: String::from("0.5"),
        }],
    })
    .await;

    ann.follow(FollowInput {
        agent: cat.pubkey.clone(),
        follow_topics: vec![FollowTopicInput {
            topic: String::from("holochain"),
            weight: String::from("1.0"),
        }],
    })
    .await;

    ann.follow(FollowInput {
        agent: dave.pubkey.clone(),
        follow_topics: vec![FollowTopicInput {
            topic: String::from("holochain"),
            weight: String::from("0.25"),
        }],
    })
    .await;

    // ann.follow(FollowInput {
    //     agent: emma.pubkey.clone(),
    //     follow_topics: vec![FollowTopicInput {
    //         topic: String::from("holochain"),
    //         weight: String::from("0.75"),
    //     }],
    // })
    // .await;

    // ann.follow(FollowInput {
    //     agent: frank.pubkey.clone(),
    //     follow_topics: vec![FollowTopicInput {
    //         topic: String::from("holochain"),
    //         weight: String::from("-1"), // Negative indicates spam or otherwise matierial to be thrown out
    //     }],
    // })
    // .await;

    // #Blockchain

    ann.follow(FollowInput {
        agent: bob.pubkey.clone(),
        follow_topics: vec![FollowTopicInput {
            topic: String::from("blockchain"),
            weight: String::from("0.1"),
        }],
    })
    .await;

    ann.follow(FollowInput {
        agent: cat.pubkey.clone(),
        follow_topics: vec![FollowTopicInput {
            topic: String::from("blockchain"),
            weight: String::from("0"),
        }],
    })
    .await;

    ann.follow(FollowInput {
        agent: dave.pubkey.clone(),
        follow_topics: vec![FollowTopicInput {
            topic: String::from("blockchain"),
            weight: String::from("0.55"),
        }],
    })
    .await;

    // ann.follow(FollowInput {
    //     agent: emma.pubkey.clone(),
    //     follow_topics: vec![FollowTopicInput {
    //         topic: String::from("blockchain"),
    //         weight: String::from("0.33"),
    //     }],
    // })
    // .await;

    // ann.follow(FollowInput {
    //     agent: frank.pubkey.clone(),
    //     follow_topics: vec![FollowTopicInput {
    //         topic: String::from("blockchain"),
    //         weight: String::from("0.9"),
    //     }],
    // })
    // .await;

    // MEWS //

    // #Holochain

    bob.create_mew(Mew {
        mew_type: MewType::Original,
        text: String::from("#holochain from bob, weight 0.5"),
        links: vec![],
    })
    .await;

    cat.create_mew(Mew {
        mew_type: MewType::Original,
        text: String::from("#holochain from cat, weight 1.0"),
        links: vec![],
    })
    .await;

    dave.create_mew(Mew {
        mew_type: MewType::Original,
        text: String::from("#holochain from dave, weight 0.25"),
        links: vec![],
    })
    .await;

    // emma.create_mew(Mew {
    //     mew_type: MewType::Original,
    //     text: String::from("#holochain from emma, weight 0.75"),
    //     links: vec![],
    // })
    // .await;

    // frank
    //     .create_mew(Mew {
    //         mew_type: MewType::Original,
    //         text: String::from("#holochain from frank, weight -1 should not be seen"),
    //         links: vec![],
    //     })
    //     .await;

    // #Blockchain

    bob.create_mew(Mew {
        mew_type: MewType::Original,
        text: String::from("#blockchain from bob, weight 0.1"),
        links: vec![],
    })
    .await;

    cat.create_mew(Mew {
        mew_type: MewType::Original,
        text: String::from("#blockchain from cat, weight 0 should not be seen"),
        links: vec![],
    })
    .await;

    dave.create_mew(Mew {
        mew_type: MewType::Original,
        text: String::from("#blockchain from dave, weight 0.55"),
        links: vec![],
    })
    .await;

    // emma.create_mew(Mew {
    //     mew_type: MewType::Original,
    //     text: String::from("#blockchain from emma, weight 0.33"),
    //     links: vec![],
    // })
    // .await;

    // frank
    //     .create_mew(Mew {
    //         mew_type: MewType::Original,
    //         text: String::from("#blockchain from frank, weight 0.9"),
    //         links: vec![],
    //     })
    //     .await;

    consistency_10s([
        &(ann.cell.clone()),
        &(bob.cell.clone()),
        &(cat.cell.clone()),
        &(dave.cell.clone()),
        // &(emma.cell.clone()),
        // &(frank.cell.clone()),
    ])
    .await;

    // Show all mews on holochain topic above 0 threshold
    let trusted_feed_holochain_topic_positive = ann
        .trusted_feed_weighted(TrustedFeedInput {
            agent: ann.pubkey.clone(),
            topic: "holochain".to_string(),
            weight: "0.000001".to_string(),
        })
        .await;

    println!(
        "trusted feed: {:#?}",
        trusted_feed_holochain_topic_positive.clone()
    );

    assert!(trusted_feed_holochain_topic_positive.len() == 3);
    assert_eq!(
        trusted_feed_holochain_topic_positive[0].mew.text,
        String::from("#holochain from cat, weight 1.0")
    );
    assert_eq!(
        trusted_feed_holochain_topic_positive[1].mew.text,
        String::from("#holochain from bob, weight 0.5")
    );
    assert_eq!(
        trusted_feed_holochain_topic_positive[2].mew.text,
        String::from("#holochain from dave, weight 0.25")
    );

    // Show all mews on blockchain topic above 0 threshold
    let trusted_feed_blockchain_topic_positive = ann
        .trusted_feed_weighted(TrustedFeedInput {
            agent: ann.pubkey.clone(),
            topic: "blockchain".to_string(),
            weight: "0.000001".to_string(),
        })
        .await;

    println!(
        "trusted feed: {:#?}",
        trusted_feed_blockchain_topic_positive.clone()
    );

    assert!(trusted_feed_blockchain_topic_positive.len() == 2);
    assert_eq!(
        trusted_feed_blockchain_topic_positive[0].mew.text,
        String::from("#blockchain from dave, weight 0.55")
    );
    assert_eq!(
        trusted_feed_blockchain_topic_positive[1].mew.text,
        String::from("#blockchain from bob, weight 0.1")
    );
}

//
// ^^^ TESTS: ^^^
//
// vvv TEST HELPERS: vvv
//

pub struct Agent<'a> {
    pub cell: SweetCell,
    pub conductor: &'a SweetConductor,
    pub pubkey: AgentPubKey,
    pub mews_zome: SweetZome,
    pub follows_zome: SweetZome,
    pub trust_atom_zome: SweetZome,
}

impl Agent<'_> {
    pub async fn follow(&self, input: FollowInput) {
        self.conductor
            .call(&self.follows_zome, "follow", input)
            .await
    }

    pub async fn create_mew(&self, input: Mew) -> ActionHash {
        self.conductor
            .call(&self.mews_zome, "create_mew", input)
            .await
    }

    // pub async fn recommended(&self, input: RecommendedInput) -> Vec<FeedMew> {
    //     self.conductor.call(&self.zome, "recommended", input).await
    // }

    pub async fn trusted_feed_weighted(&self, input: TrustedFeedInput) -> Vec<FeedMew> {
        self.conductor
            .call(
                &self.mews_zome,
                "get_batch_mews_with_context_based_on_topic_and_weight_threshold",
                input,
            )
            .await
    }
}

pub struct AgentGroup {
    conductors: SweetConductorBatch,
}

impl AgentGroup {
    #[allow(clippy::needless_lifetimes)]
    pub async fn create_agents<'a>(&'a mut self) -> Vec<Agent<'a>> {
        let dna_path = std::env::current_dir().unwrap().join(DNA_FILEPATH);
        let dna = SweetDnaFile::from_bundle(&dna_path).await.unwrap();

        let apps = self.conductors.setup_app("mewsfeed", &[dna]).await.unwrap();
        self.conductors.exchange_peer_info().await;

        let ((ann_cell,), (bob_cell,), (cat_cell,), (dave_cell,)) = apps.into_tuples();

        let ann = Agent {
            cell: ann_cell.clone(),
            conductor: self.conductors.get(0).unwrap(),
            pubkey: ann_cell.agent_pubkey().clone(),
            mews_zome: ann_cell.zome(MEWS_ZOME_NAME),
            follows_zome: ann_cell.zome(FOLLOWS_ZOME_NAME),
            trust_atom_zome: ann_cell.zome(TRUST_ATOM_ZOME_NAME),
        };
        let bob = Agent {
            cell: bob_cell.clone(),
            conductor: self.conductors.get(1).unwrap(),
            pubkey: bob_cell.agent_pubkey().clone(),
            mews_zome: bob_cell.zome(MEWS_ZOME_NAME),
            follows_zome: bob_cell.zome(FOLLOWS_ZOME_NAME),
            trust_atom_zome: bob_cell.zome(TRUST_ATOM_ZOME_NAME),
        };
        let cat = Agent {
            cell: cat_cell.clone(),
            conductor: self.conductors.get(2).unwrap(),
            pubkey: cat_cell.agent_pubkey().clone(),
            mews_zome: cat_cell.zome(MEWS_ZOME_NAME),
            follows_zome: cat_cell.zome(FOLLOWS_ZOME_NAME),
            trust_atom_zome: cat_cell.zome(TRUST_ATOM_ZOME_NAME),
        };
        let dave = Agent {
            cell: dave_cell.clone(),
            conductor: self.conductors.get(3).unwrap(),
            pubkey: dave_cell.agent_pubkey().clone(),
            mews_zome: dave_cell.zome(MEWS_ZOME_NAME),
            follows_zome: dave_cell.zome(FOLLOWS_ZOME_NAME),
            trust_atom_zome: dave_cell.zome(TRUST_ATOM_ZOME_NAME),
        };
        // let emma = Agent {
        //     cell: emma_cell.clone(),
        //     conductor: self.conductors.get(4).unwrap(),
        //     pubkey: emma_cell.agent_pubkey().clone(),
        //     mews_zome: emma_cell.zome(MEWS_ZOME_NAME),
        //     follows_zome: emma_cell.zome(FOLLOWS_ZOME_NAME),
        // };
        // let frank = Agent {
        //     cell: frank_cell.clone(),
        //     conductor: self.conductors.get(5).unwrap(),
        //     pubkey: frank_cell.agent_pubkey().clone(),
        //     mews_zome: frank_cell.zome(MEWS_ZOME_NAME),
        //     follows_zome: frank_cell.zome(FOLLOWS_ZOME_NAME),
        // };

        vec![ann, bob, cat, dave]
    }
}

pub async fn setup() -> AgentGroup {
    let conductors = SweetConductorBatch::from_config(4, ConductorConfig::default()).await;
    AgentGroup { conductors }
}
