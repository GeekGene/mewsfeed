import {
  AgentPubKeyB64,
  HeaderHash,
  HeaderHashB64,
  serializeHash,
} from "@holochain-open-dev/core-types";
import { getZomeCaller, pause, Scenario } from "@holochain/tryorama";
import test from "tape";
import {
  CreateMewInput,
  FeedMew,
  MewTypeName,
  MewYarn,
} from "../../../ui/src/types/types.js";
import { clutterDna } from "../utils.js";

test.skip("Mew Yarn", async (t) => {
  const scenario = new Scenario();
  const alice = await scenario.addPlayerWithHapp({ dnas: [clutterDna] });

  const originalMewInput: CreateMewInput = {
    text: "hello",
    mewType: { [MewTypeName.Original]: null },
  };
  const entryHeaderHash: HeaderHash = await alice.cells[0].callZome({
    zome_name: "mews",
    fn_name: "create_mew",
    payload: originalMewInput,
  });

  const feedMew: FeedMew = await alice.cells[0].callZome({
    zome_name: "mews",
    fn_name: "get_feed_mew_and_context",
    payload: entryHeaderHash,
  });
  const replyMewInput: CreateMewInput = {
    text: "response",
    mewType: { [MewTypeName.Reply]: feedMew.headerHash },
  };
  await alice.cells[0].callZome({
    zome_name: "mews",
    fn_name: "create_mew",
    payload: replyMewInput,
  });

  const mewYarn: MewYarn = await alice.cells[0].callZome({
    zome_name: "mews",
    fn_name: "get_mew_yarn",
    payload: entryHeaderHash,
  });
  console.log("mewYarn", mewYarn.replies);
  t.ok(mewYarn.replies.length === 1, "one reply");
  await scenario.cleanUp();
});

test("Following oneself should fail", async (t) => {
  const scenario = new Scenario();
  const alice = await scenario.addPlayerWithHapp({ dnas: [clutterDna] });
  try {
    await alice.cells[0].callZome({ zome_name: "mews", fn_name: "follow" });
    t.fail();
  } catch (e) {
    const myFollowers: AgentPubKeyB64[] = await alice.cells[0].callZome({
      zome_name: "mews",
      fn_name: "my_following",
      payload: null,
    });
    t.equal(myFollowers.length, 0, "no followers");
    t.ok(true, "following self failed");
  }
  await scenario.cleanUp();
});

test("Following", async (t) => {
  const scenario = new Scenario();
  const [alice, bob] = await scenario.addPlayersWithHapps([
    { dnas: [clutterDna] },
    { dnas: [clutterDna] },
  ]);
  const aliceCallMewsZome = getZomeCaller(alice.cells[0], "mews");
  const bobCallMewsZome = getZomeCaller(bob.cells[0], "mews");

  await scenario.shareAllAgents();

  const aliceFollowersInitial: AgentPubKeyB64[] = await aliceCallMewsZome(
    "my_followers",
    null
  );
  t.ok(aliceFollowersInitial.length === 0, "alice has no followers");

  const aliceMyFollowingInitial: AgentPubKeyB64[] = await aliceCallMewsZome(
    "my_following",
    null
  );
  t.ok(aliceMyFollowingInitial.length === 0, "alice is not following anyone");

  // bob starts following alice
  await bobCallMewsZome("follow", alice.agentPubKey);
  await pause(100);

  const aliceFollowers: AgentPubKeyB64[] = await aliceCallMewsZome(
    "my_followers",
    null
  );
  const bobAgentPubKey = serializeHash(bob.agentPubKey);
  t.deepEqual(aliceFollowers, [bobAgentPubKey], "bob follows alice");

  const aliceAgentPubKey = serializeHash(alice.agentPubKey);
  const followersOfAlice: AgentPubKeyB64[] = await aliceCallMewsZome(
    "followers",
    aliceAgentPubKey
  );
  t.deepEqual(followersOfAlice, [bobAgentPubKey], "bob is a follower of alice");

  const bobMyFollowing = await bobCallMewsZome("my_following", null);
  t.deepEqual(bobMyFollowing, [aliceAgentPubKey], "bob is following alice");

  const bobMyFollowers: AgentPubKeyB64[] = await bobCallMewsZome(
    "my_followers",
    null
  );
  t.ok(bobMyFollowers.length === 0, "bob has no followers");

  const agentsFollowingAlice: AgentPubKeyB64[] = await bobCallMewsZome(
    "following",
    bobAgentPubKey
  );
  t.deepEqual(
    agentsFollowingAlice,
    [aliceAgentPubKey],
    "bob is a followee of alice"
  );

  await scenario.cleanUp();
});

test("Mews by", async (t) => {
  const scenario = new Scenario();
  const [alice, bob] = await scenario.addPlayersWithHapps([
    { dnas: [clutterDna] },
    { dnas: [clutterDna] },
  ]);
  const aliceCallMewsZome = getZomeCaller(alice.cells[0], "mews");
  const bobCallMewsZome = getZomeCaller(bob.cells[0], "mews");

  await scenario.shareAllAgents();

  const originalMewContent = "test-mew";
  const originalMewInput: CreateMewInput = {
    mewType: { [MewTypeName.Original]: null },
    text: originalMewContent,
  };
  const entryHeaderHash: HeaderHashB64 = await aliceCallMewsZome(
    "create_mew",
    originalMewInput
  );
  t.ok(entryHeaderHash.startsWith("uhCkk"), "alice created a valid mew");

  const mewsByAlice: FeedMew[] = await aliceCallMewsZome(
    "mews_by",
    alice.agentPubKey
  );
  t.ok(mewsByAlice.length === 1, "mews by alice contains 1 mew");
  t.equal(
    mewsByAlice[0].mew.content?.text,
    originalMewContent,
    "mews by alice includes her mew"
  );

  const mewsByBob: FeedMew[] = await bobCallMewsZome(
    "mews_by",
    bob.agentPubKey
  );
  t.ok(mewsByBob.length === 0, "mews by bob is empty");

  await pause(100);

  const mewsByAliceInBobsCell: FeedMew[] = await bobCallMewsZome(
    "mews_by",
    alice.agentPubKey
  );
  t.ok(mewsByAliceInBobsCell.length === 1, "1 mew by alice in bob's cell");
  t.equal(
    mewsByAliceInBobsCell[0].mew.content?.text,
    originalMewContent,
    "mews by alice in bob's cell includes her mew"
  );

  await scenario.cleanUp();
});

test("Hashtag, cashtag and mention", async (t) => {
  const scenario = new Scenario();
  const alice = await scenario.addPlayerWithHapp({ dnas: [clutterDna] });
  const aliceCallMewsZome = getZomeCaller(alice.cells[0], "mews");

  const mewContent =
    "My Mew with #hashtag #سعيدة #😃😃😃 and $cashtag and @mention";
  const createMewInput: CreateMewInput = {
    mewType: {
      original: null,
    },
    text: mewContent,
  };

  const mewHash: HeaderHashB64 = await aliceCallMewsZome(
    "create_mew",
    createMewInput
  );
  t.ok(mewHash.startsWith("uhCkk"), "alice created a valid mew");
  console.log("hh", mewHash);

  await pause(100);

  const hashtaggedMews: FeedMew[] = await aliceCallMewsZome(
    "get_mews_with_hashtag",
    "#hashtag"
  );
  t.ok(hashtaggedMews.length === 1, "one mew with hashtag");
  t.equal(
    hashtaggedMews[0].mew.content?.text,
    mewContent,
    "mew content matches"
  );

  const arabicHashtaggedMews: FeedMew[] = await aliceCallMewsZome(
    "get_mews_with_hashtag",
    "#سعيدة"
  );
  t.ok(arabicHashtaggedMews.length === 1, "one mew with arabic hashtag");
  t.equal(
    arabicHashtaggedMews[0].mew.content?.text,
    mewContent,
    "mew content matches"
  );

  // get hashtag containing emojis -- invalid hashtag!
  const emojiHashtaggedMews: FeedMew[] = await aliceCallMewsZome(
    "get_mews_with_hashtag",
    "#😃😃😃"
  );
  t.ok(emojiHashtaggedMews.length === 0, "no mew with emoji hashtag");

  const cashtaggedMews: FeedMew[] = await aliceCallMewsZome(
    "get_mews_with_cashtag",
    "$cashtag"
  );
  t.ok(cashtaggedMews.length === 1, "one mew with cashtag");

  const mentionedMews: FeedMew[] = await aliceCallMewsZome(
    "get_mews_with_mention",
    "@mention"
  );
  t.ok(mentionedMews.length === 1, "one mew with mention");

  await scenario.cleanUp();
});

test("Mews Feed - should include own mews", async (t) => {
  const scenario = new Scenario();
  const [alice] = await scenario.addPlayersWithHapps([{ dnas: [clutterDna] }]);
  const aliceCallMewsZome = getZomeCaller(alice.cells[0], "mews");

  const aliceMewsFeedInitial: FeedMew[] = await aliceCallMewsZome("mews_feed", {
    option: "",
  });
  t.ok(
    aliceMewsFeedInitial.length === 0,
    "alice's mews feed is initially empty"
  );

  const mewContent = "test-mew";
  const mewInput: CreateMewInput = {
    mewType: { [MewTypeName.Original]: null },
    text: mewContent,
  };
  await aliceCallMewsZome("create_mew", mewInput);

  const aliceMewsFeed: FeedMew[] = await aliceCallMewsZome("mews_feed", {
    option: "",
  });
  t.ok(aliceMewsFeed.length === 1, "alice's mews feed includes her mew");
  t.equal(
    aliceMewsFeed[0].mew.content?.text,
    mewContent,
    "mew content matches"
  );

  await scenario.cleanUp();
});

test("Mews Feed - Should include mews of followed agent", async (t) => {
  const scenario = new Scenario();
  const [alice, bob] = await scenario.addPlayersWithHapps([
    { dnas: [clutterDna] },
    { dnas: [clutterDna] },
  ]);
  await scenario.shareAllAgents();
  const aliceCallMewsZome = getZomeCaller(alice.cells[0], "mews");
  const bobCallMewsZome = getZomeCaller(bob.cells[0], "mews");

  const mewContent = "test-mew";
  const mewInput: CreateMewInput = {
    mewType: { [MewTypeName.Original]: null },
    text: mewContent,
  };
  await aliceCallMewsZome("create_mew", mewInput);

  const bobMewsFeedInitial: FeedMew[] = await bobCallMewsZome("mews_feed", {
    option: "",
  });
  t.ok(bobMewsFeedInitial.length === 0, "bob's mews feed is initially empty");

  await bobCallMewsZome("follow", alice.agentPubKey);

  const bobMewsFeed: FeedMew[] = await bobCallMewsZome("mews_feed", {
    option: "",
  });
  t.ok(bobMewsFeed.length === 1, "bob's mews feed includes 1 mew");
  t.equal(
    bobMewsFeed[0].mew.content?.text,
    mewContent,
    "mew content in bob's mews feed matches alice's mew content"
  );

  await scenario.cleanUp();
});

test("Mews Feed - Should not include mews of non-followed agent", async (t) => {
  const scenario = new Scenario();
  const [alice, bob, carol] = await scenario.addPlayersWithHapps([
    { dnas: [clutterDna] },
    { dnas: [clutterDna] },
    { dnas: [clutterDna] },
  ]);
  await scenario.shareAllAgents();
  const aliceCallMewsZome = getZomeCaller(alice.cells[0], "mews");
  const bobCallMewsZome = getZomeCaller(bob.cells[0], "mews");
  const carolCallMewsZome = getZomeCaller(carol.cells[0], "mews");

  const aliceMewContent = "alice-test-mew";
  const aliceMewInput: CreateMewInput = {
    mewType: { [MewTypeName.Original]: null },
    text: aliceMewContent,
  };
  await aliceCallMewsZome("create_mew", aliceMewInput);

  const carolMewContent = "carol-test-mew";
  const carolMewInput: CreateMewInput = {
    mewType: { [MewTypeName.Original]: null },
    text: carolMewContent,
  };
  await carolCallMewsZome("create_mew", carolMewInput);

  await bobCallMewsZome("follow", alice.agentPubKey);

  const bobMewsFeed: FeedMew[] = await bobCallMewsZome("mews_feed", {
    option: "",
  });
  t.ok(bobMewsFeed.length === 1, "bob's mews feed includes 1 mew");
  t.equal(
    bobMewsFeed[0].mew.content?.text,
    aliceMewContent,
    "mew content in bob's mews feed matches alice's mew content"
  );

  await scenario.cleanUp();
});

test("Mews Feed - Should not include mews of un-followed agent", async (t) => {
  const scenario = new Scenario();
  const [alice, bob] = await scenario.addPlayersWithHapps([
    { dnas: [clutterDna] },
    { dnas: [clutterDna] },
  ]);
  await scenario.shareAllAgents();
  const aliceCallMewsZome = getZomeCaller(alice.cells[0], "mews");
  const bobCallMewsZome = getZomeCaller(bob.cells[0], "mews");

  const aliceMewContent = "alice-test-mew";
  const aliceMewInput: CreateMewInput = {
    mewType: { [MewTypeName.Original]: null },
    text: aliceMewContent,
  };
  await aliceCallMewsZome("create_mew", aliceMewInput);

  await bobCallMewsZome("follow", alice.agentPubKey);

  const bobMewsFeedWhenFollowing: FeedMew[] = await bobCallMewsZome(
    "mews_feed",
    { option: "" }
  );
  t.ok(bobMewsFeedWhenFollowing.length === 1, "bob's mews feed includes 1 mew");
  t.equal(
    bobMewsFeedWhenFollowing[0].mew.content?.text,
    aliceMewContent,
    "mew content in bob's mews feed matches alice's mew content"
  );

  await bobCallMewsZome("unfollow", alice.agentPubKey);

  const bobMewsFeed: FeedMew[] = await bobCallMewsZome("mews_feed", {
    option: "",
  });
  t.ok(bobMewsFeed.length === 0, "bob's mews feed is empty");

  await scenario.cleanUp();
});

test("Mews Feed - Should be ordered by timestamp in descending order", async (t) => {
  const scenario = new Scenario();
  const [alice, bob, carol] = await scenario.addPlayersWithHapps([
    { dnas: [clutterDna] },
    { dnas: [clutterDna] },
    { dnas: [clutterDna] },
  ]);
  await scenario.shareAllAgents();
  const aliceCallMewsZome = getZomeCaller(alice.cells[0], "mews");
  const bobCallMewsZome = getZomeCaller(bob.cells[0], "mews");
  const carolCallMewsZome = getZomeCaller(carol.cells[0], "mews");

  const firstMewContent = "first-test-mew";
  const firstMewInput: CreateMewInput = {
    mewType: { [MewTypeName.Original]: null },
    text: firstMewContent,
  };
  await aliceCallMewsZome("create_mew", firstMewInput);

  const secondMewContent = "second-test-mew";
  const secondMewInput: CreateMewInput = {
    mewType: { [MewTypeName.Original]: null },
    text: secondMewContent,
  };
  await bobCallMewsZome("create_mew", secondMewInput);

  const thirdMewContent = "third-test-mew";
  const thirdMewInput: CreateMewInput = {
    mewType: { [MewTypeName.Original]: null },
    text: thirdMewContent,
  };
  await carolCallMewsZome("create_mew", thirdMewInput);

  const fourthMewContent = "fourth-test-mew";
  const fourthMewInput: CreateMewInput = {
    mewType: { [MewTypeName.Original]: null },
    text: fourthMewContent,
  };
  await aliceCallMewsZome("create_mew", fourthMewInput);

  // alice starts following bob and carol
  await aliceCallMewsZome("follow", bob.agentPubKey);
  await aliceCallMewsZome("follow", carol.agentPubKey);

  await pause(100);

  const aliceMewsFeed: FeedMew[] = await aliceCallMewsZome("mews_feed", {
    option: "",
  });
  t.ok(aliceMewsFeed.length === 4, "alice's mews feed includes all 4 mews");
  t.equal(
    aliceMewsFeed[0].mew.content?.text,
    fourthMewContent,
    "mew 1 in feed is fourth mew"
  );
  t.equal(
    aliceMewsFeed[1].mew.content?.text,
    thirdMewContent,
    "mew 2 in feed is third mew"
  );
  t.equal(
    aliceMewsFeed[2].mew.content?.text,
    secondMewContent,
    "mew 3 in feed is second mew"
  );
  t.equal(
    aliceMewsFeed[3].mew.content?.text,
    firstMewContent,
    "mew 4 in feed is first mew"
  );

  await scenario.cleanUp();
});

test.skip("Mew Interaction - Like should be included in my likes", async (t) => {
  const scenario = new Scenario();
  const [alice] = await scenario.addPlayersWithHapps([{ dnas: [clutterDna] }]);
  const aliceCallMewsZome = getZomeCaller(alice.cells[0], "mews");

  const aliceMewContent = "alice-test-mew";
  const aliceMewInput: CreateMewInput = {
    mewType: { [MewTypeName.Original]: null },
    text: aliceMewContent,
  };
  await aliceCallMewsZome("create_mew", aliceMewInput);
  await aliceCallMewsZome("create_mew", aliceMewInput);

  // await aliceCallMewsZome("lick", )

  const aliceMewsFeed: FeedMew[] = await aliceCallMewsZome("mews_feed", {
    option: "",
  });
  console.log("alic", aliceMewsFeed);
  t.deepEqual(
    "u" + Buffer.from(aliceMewsFeed[0].header.entry_hash).toString("base64url"),
    aliceMewsFeed[0].mewEntryHash
  );
  // t.ok(aliceMewsFeed.length === 1, "alice's mews feed includes 1 mew");
  // t.equal(
  //   aliceMewsFeed[0].mew.content?.text,
  //   aliceMewContent,
  //   "mew content in bob's mews feed matches alice's mew content"
  // );

  await scenario.cleanUp();
});

//   // ==============================================
//   // test mew interaction: lick, reply, quote, and mewmew
//   // ==============================================

//   // Alice licks first mew
//   await alice.call("mews", "lick_mew", originalEntryHash);
//   let aliceLicks = await alice.call("mews", "my_licks", null);
//   t.equal(aliceLicks.length, 1);
//   t.equal(aliceLicks[0], originalEntryHash);

//   const createReplyMewInput: CreateMewInput = {
//     mewType: {
//       reply: originalEntryHash,
//     },
//     text: "reply mew to original mew!",
//   };

//   // Alice replies to first mew
//   const replyMewHash = await alice.call(
//     "mews",
//     "create_mew",
//     createReplyMewInput
//   );
//   t.ok(replyMewHash);

//   const createMewMewInput: CreateMewInput = {
//     mewType: {
//       mewMew: originalEntryHash,
//     },
//     text: null,
//   };

//   // Alice retweets first mew
//   const mewMewHash = await alice.call("mews", "create_mew", createMewMewInput);
//   t.ok(mewMewHash);

//   const createQuoteInput: CreateMewInput = {
//     mewType: {
//       quote: originalEntryHash,
//     },
//     text: "mewmew of original mew!",
//   };

//   // Alice quote tweets first mew
//   const quoteHash = await alice.call("mews", "create_mew", createQuoteInput);
//   t.ok(quoteHash);

//   await sleep(777);

//   // get orignal mew with context to see if links were created by interacting with it
//   let mewWithContext: FeedMew = await bob.call(
//     "mews",
//     "get_feed_mew_and_context",
//     mewHash
//   );
//   console.log("mew context:", mewWithContext);
//   t.equals(mewWithContext.replies.length, 1);
//   t.equals(mewWithContext.quotes.length, 1);
//   t.equals(mewWithContext.licks.length, 1);

//   // test can get mew with entry hash in addition to header hash
//   const mewFromEntryHash: Mew = await bob.call(
//     "mews",
//     "get_mew",
//     mewWithContext.replies[0]
//   );
//   console.log("mew from entry hash:", mewFromEntryHash);
//   t.equals(mewFromEntryHash.content?.text, createReplyMewInput.text);
//   t.equals("reply" in mewFromEntryHash.mewType, true);

//   mewWithContext = await bob.call(
//     "mews",
//     "get_feed_mew_and_context",
//     originalEntryHash
//   );
//   console.log("mew context:", mewWithContext);
//   t.equals(mewWithContext.replies.length, 1);
//   t.equals(mewWithContext.quotes.length, 1);
//   t.equals(mewWithContext.licks.length, 1);

//   // unlick mew
//   await alice.call("mews", "unlick_mew", originalEntryHash);
//   aliceLicks = await alice.call("mews", "my_licks", null);
//   t.equal(aliceLicks.length, 0);

//   await sleep(500);
//   mewWithContext = await bob.call(
//     "mews",
//     "get_feed_mew_and_context",
//     originalEntryHash
//   );
//   console.log("mew context:", mewWithContext);
//   t.equals(mewWithContext.replies.length, 1);
//   t.equals(mewWithContext.quotes.length, 1);
//   t.equals(mewWithContext.licks.length, 0);
// });
