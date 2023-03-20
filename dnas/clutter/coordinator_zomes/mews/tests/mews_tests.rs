#![warn(warnings)]

use futures::future;

use hdk::prelude::*;
use holochain::sweettest::{
    SweetAgents, SweetAppBatch, SweetCell, SweetConductor, SweetConductorBatch, SweetDnaFile,
};

use mews::*;
use mews_integrity::*;

const DNA_FILEPATH: &str = "../../workdir/clutter.dna";

// TESTING UTILITY FUNCTIONS

async fn setup_1_conductor() -> (SweetConductor, AgentPubKey, SweetCell) {
    let dna = SweetDnaFile::from_bundle(std::path::Path::new(DNA_FILEPATH))
        .await
        .unwrap();

    let mut conductor = SweetConductor::from_standard_config().await;

    let holo_core_agent = SweetAgents::one(conductor.keystore()).await;
    let app1 = conductor
        .setup_app_for_agent("app", holo_core_agent.clone(), &[dna.clone()])
        .await
        .unwrap();

    let cell1 = app1.into_cells()[0].clone();

    let agent_hash = holo_core_agent.into_inner();
    let agent = AgentPubKey::from_raw_39(agent_hash).unwrap();

    (conductor, agent, cell1)
}

pub async fn setup_conductors(n: usize) -> (SweetConductorBatch, Vec<AgentPubKey>, SweetAppBatch) {
    let dna = SweetDnaFile::from_bundle(std::path::Path::new(DNA_FILEPATH))
        .await
        .unwrap();

    let mut conductors = SweetConductorBatch::from_standard_config(n).await;

    let all_agents1: Vec<holochain::core::AgentPubKey> =
        future::join_all(conductors.iter().map(|c| SweetAgents::one(c.keystore()))).await;

    let all_agents2: Vec<AgentPubKey> = all_agents1
        .iter()
        .map(|holo_core_agent| {
            let agent_hash = holo_core_agent.clone().into_inner();
            AgentPubKey::from_raw_39(agent_hash).unwrap()
        })
        .collect();

    let apps = conductors
        .setup_app_for_zipped_agents("app", &all_agents1, &[dna])
        .await
        .unwrap();

    conductors.exchange_peer_info().await;
    (conductors, all_agents2, apps)
}

// TESTS:

#[tokio::test(flavor = "multi_thread")]
#[should_panic]
pub async fn mew_must_not_be_longer_than_200_chars() {
    // try {
    let (conductor, alice, cell1): (SweetConductor, AgentPubKey, SweetCell) =
        setup_1_conductor().await;

    let long_mew = std::iter::repeat('a').take(200).collect::<String>();
    let mut createMewInput = CreateMewInput {
        text: Some(long_mew),
        mew_type: MewType::Original,
        links: None,
    };

    let mewHash: ActionHash = conductor
        .call(&cell1.zome("mews"), "create_mew", createMewInput)
        .await;

    let bytes = mewHash.get_raw_39();
    let leading_bytes = bytes.get(..3).unwrap();
    assert_eq!(leading_bytes, &[132, 41, 36]);

    let too_long_mew = std::iter::repeat('a').take(201).collect::<String>();
    createMewInput = CreateMewInput {
        text: Some(too_long_mew),
        mew_type: MewType::Original,
        links: None,
    };

    // assert_panics!("Expected panic did not occur", {
    let x: () = conductor
        .call(&cell1.zome("mews"), "create_mew", createMewInput)
        .await;
    // });
}

// #[tokio::test(flavor = "multi_thread")]
// pub async fn following_oneself_should_fail() {
//     let (conductor, alice, cell1): (SweetConductor, AgentPubKey, SweetCell) =
//     setup_1_conductor().await;

//   try {
//     await alice.cells[0].callZome({ zome_name: "mews", fn_name: "follow" });
//     t.fail();
//   } catch (e) {
//     let myFollowers: AgentPubKey[] = await alice.cells[0].callZome({
//       zome_name: "mews",
//       fn_name: "my_following",
//       payload: null,
//     });
//     t.equal(myFollowers.length, 0, "no followers");
//     t.ok(true, "following self failed");
//   }
// });

// #[tokio::test(flavor = "multi_thread")]
// pub async fn following() {
//   let [alice, bob] = await scenario.addPlayersWithApps([
//     { appBundleSource: clutterHapp },
//     { appBundleSource: clutterHapp },
//   ]);

//   let bobCallMewsZome = getZomeCaller(bob.cells[0], "mews");

//   await scenario.shareAllAgents();

//   let aliceFollowersInitial: AgentPubKey[] =
//     conductor
//     .call(
//       &cell1.zome("mews"),
//     "my_followers,
//   );
//     )
//     .await;

//   let aliceMyFollowingInitial: AgentPubKey[] =
//     conductor
//     .call(
//       &cell1.zome("mews"),
//     "my_following,
//   );
//     )
//     .await;

//   // bob starts following alice
//   await bobCallMewsZome("follow", alice.agentPubKey);
//   await pause(1000);

//   let aliceFollowers: AgentPubKey[] =
//     conductor
//     .call(
//       &cell1.zome("mews"),
//       "create_mew" alice")

//     )
//     .await;

//     conductor
//     .call(
//       &cell1.zome("mews"),
//     "followers",
//     alice.agentPubKey
//     )
//     .await;

//   assert_eq!(
//     followersOfAlice,
//     [bob.agentPubKey],
//     "bob is a follower of alice"
//   );

//   let bobMyFollowing = await bobCallMewsZome("my_following", null);
//   assert_eq!(bobMyFollowing, [alice.agentPubKey], "bob is following alice");

//   let bobMyFollowers: AgentPubKey[] = await bobCallMewsZome("my_followers");
//   t.ok(bobMyFollowers.length === 0, "bob has no followers");

//   let agentsFollowingAlice: AgentPubKey[] = await bobCallMewsZome(
//     "following",
//     bob.agentPubKey
//   );
//   assert_eq!(
//     agentsFollowingAlice,
//     [alice.agentPubKey],
//     "bob is a follower of alice"
//   );

// });

// #[tokio::test(flavor = "multi_thread")]
// pub async fn mews_by() {
//   let [alice, bob] = await scenario.addPlayersWithApps([
//     { appBundleSource: clutterHapp },
//     { appBundleSource: clutterHapp },
//   ]);
//   let bobCallMewsZome = getZomeCaller(bob.cells[0], "mews");

//   await scenario.shareAllAgents();

//   let originalMewContent = "test-mew";
//   let originalMewInput: CreateMewInput = {
//     mewType: { [MewTypeName.Original]: null },
//     text: originalMewContent,
//   };
//   let entryHeaderHash: ActionHash =
//     conductor
//     .call(
//       &cell1.zome("mews"),
//     "create_mew",
//     originalMewInput
//     )
//     .await;

//   assert_eq!(
//     entryHeaderHash.slice(0, 3),
//     Buffer.from([132, 41, 36]),
//     "alice created a valid mew"
//   );

//   let mewsByAlice: FeedMew[] =
//     conductor
//     .call(
//       &cell1.zome("mews"),
//     "mews_by",
//     alice.agentPubKey
//     )
//     .await;

//   t.ok(mewsByAlice.length === 1, "mews by alice contains 1 mew");
//   t.equal(
//     mewsByAlice[0].mew.content?.text,
//     originalMewContent,
//     "mews by alice includes her mew"
//   );

//   let mewsByBob: FeedMew[] = await bobCallMewsZome(
//     "mews_by",
//     bob.agentPubKey
//   );
//   t.ok(mewsByBob.length === 0, "mews by bob is empty");

//   await pause(1000);

//   let mewsByAliceInBobsCell: FeedMew[] = await bobCallMewsZome(
//     "mews_by",
//     alice.agentPubKey
//   );
//   t.ok(mewsByAliceInBobsCell.length === 1, "1 mew by alice in bob's cell");
//   t.equal(
//     mewsByAliceInBobsCell[0].mew.content?.text,
//     originalMewContent,
//     "mews by alice in bob's cell includes her mew"
//   );

// });

// #[tokio::test(flavor = "multi_thread")]
// pub async fn hashtag_cashtag_and_mention() {
//     let (conductor, alice, cell1): (SweetConductor, AgentPubKey, SweetCell) =
//     setup_1_conductor().await;

//   let mewContent =
//     "My Mew with #hashtag #سعيدة #😃😃😃 and $cashtag and @mention";
//   let createMewInput: CreateMewInput = {
//     mew_typeOriginal,
//     text: Some(mewContent),
//     links: [{ [LinkTargetName.Mention]: alice.agentPubKey }],
//   };

//   let mewHash: ActionHash =
//     conductor
//     .call(
//       &cell1.zome("mews"),
//     "create_mew",
//     createMewInput
//     )
//     .await;

//   assert_eq!(
//     mewHash.slice(0, 3),
//     Buffer.from([132, 41, 36]),
//     "alice created a valid mew"
//   );

//   await pause(1000);

//   let hashtaggedMews: FeedMew[] =
//     conductor
//     .call(
//       &cell1.zome("mews"),
//     "get_mews_with_hashtag",
//     "#hashtag"
//     )
//     .await;

//   t.ok(hashtaggedMews.length === 1, "one mew with hashtag");
//   t.equal(
//     hashtaggedMews[0].mew.content?.text,
//     mewContent,
//     "mew content matches"
//   );

//   let arabicHashtaggedMews: FeedMew[] =
//     conductor
//     .call(
//       &cell1.zome("mews"),
//     "get_mews_with_hashtag",
//     "#سعيدة"
//     )
//     .await;

//   t.ok(arabicHashtaggedMews.length === 1, "one mew with arabic hashtag");
//   t.equal(
//     arabicHashtaggedMews[0].mew.content?.text,
//     mewContent,
//     "mew content matches"
//   );

//   // get hashtag containing emojis -- invalid hashtag!
//   let emojiHashtaggedMews: FeedMew[] =
//     conductor
//     .call(
//       &cell1.zome("mews"),
//     "get_mews_with_hashtag",
//     "#😃😃😃"
//     )
//     .await;

//   t.ok(emojiHashtaggedMews.length === 0, "no mew with emoji hashtag");

//   let cashtaggedMews: FeedMew[] =
//     conductor
//     .call(
//       &cell1.zome("mews"),
//     "get_mews_with_cashtag",
//     "$cashtag"
//     )
//     .await;

//   t.ok(cashtaggedMews.length === 1, "one mew with cashtag");

//   let mentionedMews: FeedMew[] =
//     conductor
//     .call(
//       &cell1.zome("mews"),
//     "get_mews_with_mention",
//     alice.agentPubKey
//     )
//     .await;

//   t.ok(mentionedMews.length === 1, "one mew with mention");

// });

// #[tokio::test(flavor = "multi_thread")]
// pub async fn search_should_return_hashtags_and_cashtags() {
//     let (conductor, alice, cell1): (SweetConductor, AgentPubKey, SweetCell) =
//     setup_1_conductor().await;

//   let mewContent =
//     "My Mew with #hashtag #سعيدة #😃😃😃 and $cashtag and @mention";
//   let createMewInput: CreateMewInput = {
//     mew_typeOriginal,
//     text: Some(mewContent),
//     links: [{ [LinkTargetName.Mention]: alice.agentPubKey }],
//   };

//   let mewHash: ActionHash =
//     conductor
//     .call(
//       &cell1.zome("mews"),
//     "create_mew",
//     createMewInput
//     )
//     .await;

//   assert_eq!(
//     mewHash.slice(0, 3),
//     Buffer.from([132, 41, 36]),
//     "alice created a valid mew"
//   );

//   await pause(1000);

//   let hashtags: string[] =
//     conductor
//     .call(
//       &cell1.zome("mews"),
//       "create_mew" hashtag")
//   t.equal(hashtags[0], "hashtag", "hashtag search result matches");
//     )
//     .await;

//   let arabicHashtags: string[] =
//     conductor
//     .call(
//       &cell1.zome("mews"),
//     "search_hashtags",
//     "سعيدة"
//     )
//     .await;

//   t.ok(arabicHashtags.length === 1, "one arabic hashtag");
//   t.equal(arabicHashtags[0], "سعيدة", "hashtag search result matches");

//   // get hashtag containing emojis -- invalid hashtag!
//   let emojiHashtags: string[] =
//     conductor
//     .call(
//       &cell1.zome("mews"),
//     "search_hashtags",
//     "😃😃😃"
//     )
//     .await;

//   t.ok(emojiHashtags.length === 0, "no emoji hashtags");

//   let cashtags: string[] =
//     conductor
//     .call(
//       &cell1.zome("mews"),
//       "create_mew" cashtag")
//   t.equal(cashtags[0], "cashtag", "hashtag search result matches");
//     )
//     .await;

// });

// #[tokio::test(flavor = "multi_thread")]
// pub async fn mews_feed_should_include_own_mews() {
//     let (conductor, alice, cell1): (SweetConductor, AgentPubKey, SweetCell) =
//     setup_1_conductor().await;

//   let aliceMewsFeedInitial: FeedMew[] =
//     conductor
//     .call(
//       &cell1.zome("mews"),
//     option: "",
//   });
//     )
//     .await;

//     aliceMewsFeedInitial.length === 0,
//     "alice's mews feed is initially empty"
//   );

//   let mewContent = "test-mew";
//   let mewInput: CreateMewInput = {
//     mewType: { [MewTypeName.Original]: null },
//     text: Some(mewContent),
//     None,
//   };

//     conductor
//     .await;

//       &cell1.zome("mews"),
//       "create_mew",
//       trust_atom_input,
//   let aliceMewsFeed: FeedMew[] =
//     conductor
//     .call(
//       &cell1.zome("mews"),
//     option: "",
//   });
//     )
//     .await;

//   t.equal(
//     aliceMewsFeed[0].mew.content?.text,
//     mewContent,
//     "mew content matches"
//   );

// });

// #[tokio::test(flavor = "multi_thread")]
// pub async fn mews_feed_should_include_mews_of_followed_agent() {
//   let [alice, bob] = await scenario.addPlayersWithApps([
//     { appBundleSource: clutterHapp },
//     { appBundleSource: clutterHapp },
//   ]);
//   await scenario.shareAllAgents();
//   let bobCallMewsZome = getZomeCaller(bob.cells[0], "mews");

//   let mewContent = "test-mew";
//   let mewInput: CreateMewInput = {
//     mewType: { [MewTypeName.Original]: null },
//     text: Some(mewContent),
//     None,
//   };

//     conductor
//     .await;

//       &cell1.zome("mews"),
//       "create_mew",
//       trust_atom_input,
//   let bobMewsFeedInitial: FeedMew[] = await bobCallMewsZome("mews_feed", {
//     option: "",
//   });
//   t.ok(bobMewsFeedInitial.length === 0, "bob's mews feed is initially empty");

//   await bobCallMewsZome("follow", alice.agentPubKey);

//   let bobMewsFeed: FeedMew[] = await bobCallMewsZome("mews_feed", {
//     option: "",
//   });
//   t.ok(bobMewsFeed.length === 1, "bob's mews feed includes 1 mew");
//   t.equal(
//     bobMewsFeed[0].mew.content?.text,
//     mewContent,
//     "mew content in bob's mews feed matches alice's mew content"
//   );

// });

// #[tokio::test(flavor = "multi_thread")]
// pub async fn mews_feed_should_not_include_mews_of_non_followed_agent() {
//   let [alice, bob, carol] = await scenario.addPlayersWithApps([
//     { appBundleSource: clutterHapp },
//     { appBundleSource: clutterHapp },
//     { appBundleSource: clutterHapp },
//   ]);
//   await scenario.shareAllAgents();
//   let bobCallMewsZome = getZomeCaller(bob.cells[0], "mews");
//   let carolCallMewsZome = getZomeCaller(carol.cells[0], "mews");

//   let aliceMewContent = "alice-test-mew";
//   let aliceMewInput: CreateMewInput = {
//     mewType: { [MewTypeName.Original]: null },
//     text: Some(aliceMewContent),
//     None,
//   };

//     conductor
//     .await;

//       &cell1.zome("mews"),
//       "create_mew",
//       trust_atom_input,
//   let carolMewContent = "carol-test-mew";
//   let carolMewInput: CreateMewInput = {
//     mewType: { [MewTypeName.Original]: null },
//     text: Some(carolMewContent),
//     None,
//   };
//   await carolCallMewsZome("create_mew", carolMewInput);

//   await bobCallMewsZome("follow", alice.agentPubKey);
//   await pause(1000);

//   let bobMewsFeed: FeedMew[] = await bobCallMewsZome("mews_feed", {
//     option: "",
//   });
//   t.ok(bobMewsFeed.length === 1, "bob's mews feed includes 1 mew");
//   t.equal(
//     bobMewsFeed[0].mew.content?.text,
//     aliceMewContent,
//     "mew content in bob's mews feed matches alice's mew content"
//   );

// });

// #[tokio::test(flavor = "multi_thread")]
// pub async fn mews_feed_un_following_should_exclude_agent_s_mews_from_feed() {
//   let [alice, bob] = await scenario.addPlayersWithApps([
//     { appBundleSource: clutterHapp },
//     { appBundleSource: clutterHapp },
//   ]);
//   await scenario.shareAllAgents();
//   let bobCallMewsZome = getZomeCaller(bob.cells[0], "mews");

//   let aliceMewContent = "alice-test-mew";
//   let aliceMewInput: CreateMewInput = {
//     mewType: { [MewTypeName.Original]: null },
//     text: Some(aliceMewContent),
//     None,
//   };

//     conductor
//     .await;

//       &cell1.zome("mews"),
//       "create_mew",
//       trust_atom_input,
//   await bobCallMewsZome("follow", alice.agentPubKey);
//   await pause(1000);

//   let bobMewsFeedWhenFollowing: FeedMew[] = await bobCallMewsZome(
//     "mews_feed",
//     { option: "" }
//   );
//   t.ok(bobMewsFeedWhenFollowing.length === 1, "bob's mews feed includes 1 mew");
//   t.equal(
//     bobMewsFeedWhenFollowing[0].mew.content?.text,
//     aliceMewContent,
//     "mew content in bob's mews feed matches alice's mew content"
//   );

//   await bobCallMewsZome("unfollow", alice.agentPubKey);

//   let bobMewsFeed: FeedMew[] = await bobCallMewsZome("mews_feed", {
//     option: "",
//   });
//   t.ok(bobMewsFeed.length === 0, "bob's mews feed is empty");

// });

// #[tokio::test(flavor = "multi_thread")]
// pub async fn mews_feed_should_be_ordered_by_timestamp_in_descending_order() {
//   let [alice, bob, carol] = await scenario.addPlayersWithApps([
//     { appBundleSource: clutterHapp },
//     { appBundleSource: clutterHapp },
//     { appBundleSource: clutterHapp },
//   ]);
//   await scenario.shareAllAgents();
//   let bobCallMewsZome = getZomeCaller(bob.cells[0], "mews");
//   let carolCallMewsZome = getZomeCaller(carol.cells[0], "mews");

//   let firstMewContent = "first-test-mew";
//   let firstMewInput: CreateMewInput = {
//     mewType: { [MewTypeName.Original]: null },
//     text: Some(firstMewContent),
//     None,
//   };

//     conductor
//     .await;

//       &cell1.zome("mews"),
//       "create_mew",
//       trust_atom_input,
//   let secondMewContent = "second-test-mew";
//   let secondMewInput: CreateMewInput = {
//     mewType: { [MewTypeName.Original]: null },
//     text: Some(secondMewContent),
//     None,
//   };
//   await bobCallMewsZome("create_mew", secondMewInput);

//   let thirdMewContent = "third-test-mew";
//   let thirdMewInput: CreateMewInput = {
//     mewType: { [MewTypeName.Original]: null },
//     text: Some(thirdMewContent),
//     None,
//   };
//   await carolCallMewsZome("create_mew", thirdMewInput);

//   let fourthMewContent = "fourth-test-mew";
//   let fourthMewInput: CreateMewInput = {
//     mewType: { [MewTypeName.Original]: null },
//     text: Some(fourthMewContent),
//     None,
//   };

//     conductor
//     .await;

//       &cell1.zome("mews"),
//       "create_mew",
//       trust_atom_input,
//   // alice starts following bob and carol

//     conductor
//     .call

//     .await;
//       &cell1.zome("mews"),
//       "create_mew",
//       trust_atom_input,
//     .await;

//       &cell1.zome("mews"),
//       "create_mew",
//       trust_atom_input,
//   await pause(1000);

//   let aliceMewsFeed: FeedMew[] =
//     conductor
//     .call(
//       &cell1.zome("mews"),
//     option: "",
//   });
//     )
//     .await;

//   t.equal(
//     aliceMewsFeed[0].mew.content?.text,
//     fourthMewContent,
//     "mew 1 in feed is fourth mew"
//   );
//   t.equal(
//     aliceMewsFeed[1].mew.content?.text,
//     thirdMewContent,
//     "mew 2 in feed is third mew"
//   );
//   t.equal(
//     aliceMewsFeed[2].mew.content?.text,
//     secondMewContent,
//     "mew 3 in feed is second mew"
//   );
//   t.equal(
//     aliceMewsFeed[3].mew.content?.text,
//     firstMewContent,
//     "mew 4 in feed is first mew"
//   );

// });

// #[tokio::test(flavor = "multi_thread")]
// pub async fn mew_interaction_liked_mew_should_be_included_in_my_likes() {
//     let (conductor, alice, cell1): (SweetConductor, AgentPubKey, SweetCell) =
//     setup_1_conductor().await;

//   let aliceMewContent = "alice-test-mew";
//   let aliceMewInput: CreateMewInput = {
//     mewType: { [MewTypeName.Original]: null },
//     text: Some(aliceMewContent),
//     None,
//   };
//   let mewHeaderHash: ActionHash =
//     conductor
//     .call(
//       &cell1.zome("mews"),
//     "create_mew",
//     aliceMewInput
//     )
//     .await;

//     conductor
//     .await;

//       &cell1.zome("mews"),
//       "create_mew",
//       trust_atom_input,
//   let myLikes: ActionHash[] =
//     conductor
//     .call(
//       &cell1.zome("mews"),
//       "create_mew" like")
//   assert_eq!(myLikes[0], mewHeaderHash, "alice's like is the mew she created");
//     )
//     .await;

// });

// #[tokio::test(flavor = "multi_thread")]
// pub async fn mew_interaction_unliked_mew_should_be_excluded_from_my_likes() {
//     let (conductor, alice, cell1): (SweetConductor, AgentPubKey, SweetCell) =
//     setup_1_conductor().await;

//   let aliceMewContent = "alice-test-mew";
//   let aliceMewInput: CreateMewInput = {
//     mewType: { [MewTypeName.Original]: null },
//     text: Some(aliceMewContent),
//     None,
//   };
//   let mewHeaderHash: ActionHash =
//     conductor
//     .call(
//       &cell1.zome("mews"),
//     "create_mew",
//     aliceMewInput
//     )
//     .await;

//     conductor
//     .call

//     .await;
//       &cell1.zome("mews"),
//       "create_mew",
//       trust_atom_input,
//     .await;

//       &cell1.zome("mews"),
//       "create_mew",
//       trust_atom_input,
//   let myLikes: ActionHash[] =
//     conductor
//     .call(
//       &cell1.zome("mews"),
//       "create_mew" likes")

//     )
//     .await;

// });

// #[tokio::test(flavor = "multi_thread")]
// pub async fn mew_interaction_replying_to_a_mew_should_be_linked_correctly() {
//   let alice = await scenario.addPlayerWithApp(clutterHapp);

//   let aliceMewContent = "alice-test-mew";
//   let aliceMewInput: CreateMewInput = {
//     mewType: { [MewTypeName.Original]: null },
//     text: Some(aliceMewContent),
//     None,
//   };
//   let mewHeaderHash: ActionHash =
//     conductor
//     .call(
//       &cell1.zome("mews"),
//     "create_mew",
//     aliceMewInput
//     )
//     .await;

//   let aliceReplyContent = "alice-test-reply";
//   let aliceReplyInput: CreateMewInput = {
//     mewType: { [MewTypeName.Reply]: mewHeaderHash },
//     text: Some(aliceReplyContent),
//     None,
//   };
//   let replyHeaderHash: ActionHash =
//     conductor
//     .call(
//       &cell1.zome("mews"),
//     "create_mew",
//     aliceReplyInput
//     )
//     .await;

//   let replyMew: FeedMew =
//     conductor
//     .call(
//       &cell1.zome("mews"),
//     "get_feed_mew_and_context",
//     replyHeaderHash
//     )
//     .await;

//   t.ok(MewTypeName.Reply in replyMew.mew.mewType, "mew is a reply");
//   t.equal(
//     replyMew.mew.content?.text,
//     aliceReplyContent,
//     "reply is alice's reply"
//   );

//   let originalMew: FeedMew =
//     conductor
//     .call(
//       &cell1.zome("mews"),
//     "get_feed_mew_and_context",
//     mewHeaderHash
//     )
//     .await;

//   t.ok(
//     MewTypeName.Original in originalMew.mew.mewType,
//     "mew is an original mew"
//   );
//   t.equal(originalMew.mew.content?.text, aliceMewContent, "mew is alice's mew");
//   t.ok(originalMew.replies.length === 1, "original mew has 1 reply");
//   assert_eq!(
//     originalMew.replies[0],
//     replyHeaderHash,
//     "original mew's reply is alice's reply"
//   );

// });

// #[tokio::test(flavor = "multi_thread")]
// pub async fn mew_interaction_mewmewing_a_mew_should_be_linked_correctly() {
//   let alice = await scenario.addPlayerWithApp(clutterHapp);

//   let aliceMewContent = "alice-test-mew";
//   let aliceMewInput: CreateMewInput = {
//     mewType: { [MewTypeName.Original]: null },
//     text: Some(aliceMewContent),
//     None,
//   };
//   let mewHeaderHash: ActionHash =
//     conductor
//     .call(
//       &cell1.zome("mews"),
//     "create_mew",
//     aliceMewInput
//     )
//     .await;

//   let aliceMewmewInput: CreateMewInput = {
//     mewType: { [MewTypeName.MewMew]: mewHeaderHash },
//     text: Some(null),
//     None,
//   };
//   let mewmewHeaderHash: ActionHash =
//     conductor
//     .call(
//       &cell1.zome("mews"),
//     "create_mew",
//     aliceMewmewInput
//     )
//     .await;

//   let mewmew: FeedMew =
//     conductor
//     .call(
//       &cell1.zome("mews"),
//     "get_feed_mew_and_context",
//     mewmewHeaderHash
//     )
//     .await;

//   t.ok(MewTypeName.MewMew in mewmew.mew.mewType, "mew is a mewmew");
//   t.equal(mewmew.mew.content, null, "mewmew is alice's mewmew");

//   let originalMew: FeedMew =
//     conductor
//     .call(
//       &cell1.zome("mews"),
//     "get_feed_mew_and_context",
//     mewHeaderHash
//     )
//     .await;

//   t.ok(
//     MewTypeName.Original in originalMew.mew.mewType,
//     "mew is an original mew"
//   );
//   t.equal(originalMew.mew.content?.text, aliceMewContent, "mew is alice's mew");
//   t.ok(originalMew.mewmews.length === 1, "original mew has 1 mewmew");
//   assert_eq!(
//     originalMew.mewmews[0],
//     mewmewHeaderHash,
//     "original mew's mewmew is alice's mewmew"
//   );

// });

// #[tokio::test(flavor = "multi_thread")]
// pub async fn mew_interaction_quoting_a_mew_should_be_linked_correctly() {
//   let alice = await scenario.addPlayerWithApp(clutterHapp);

//   let aliceMewContent = "alice-test-mew";
//   let aliceMewInput: CreateMewInput = {
//     mewType: { [MewTypeName.Original]: null },
//     text: Some(aliceMewContent),
//     None,
//   };
//   let mewHeaderHash: ActionHash =
//     conductor
//     .call(
//       &cell1.zome("mews"),
//     "create_mew",
//     aliceMewInput
//     )
//     .await;

//   let aliceQuoteText = "alice-test-quote";
//   let aliceQuoteInput: CreateMewInput = {
//     mewType: { [MewTypeName.Quote]: mewHeaderHash },
//     text: Some(aliceQuoteText),
//     None,
//   };
//   let quoteHeaderHash: ActionHash =
//     conductor
//     .call(
//       &cell1.zome("mews"),
//     "create_mew",
//     aliceQuoteInput
//     )
//     .await;

//   let quote: FeedMew =
//     conductor
//     .call(
//       &cell1.zome("mews"),
//     "get_feed_mew_and_context",
//     quoteHeaderHash
//     )
//     .await;

//   t.ok(MewTypeName.Quote in quote.mew.mewType, "mew is a quote");
//   t.equal(quote.mew.content?.text, aliceQuoteText, "quote is alice's quote");

//   let originalMew: FeedMew =
//     conductor
//     .call(
//       &cell1.zome("mews"),
//     "get_feed_mew_and_context",
//     mewHeaderHash
//     )
//     .await;

//   t.ok(
//     MewTypeName.Original in originalMew.mew.mewType,
//     "mew is an original mew"
//   );
//   t.equal(originalMew.mew.content?.text, aliceMewContent, "mew is alice's mew");
//   t.ok(originalMew.quotes.length === 1, "original mew has 1 quote");
//   assert_eq!(
//     originalMew.quotes[0],
//     quoteHeaderHash,
//     "original mew's quote is alice's quote"
//   );

// });
