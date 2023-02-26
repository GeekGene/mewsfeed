import { ActionHash, AgentPubKey } from "@holochain/client";
import { getZomeCaller, pause, Scenario } from "@holochain/tryorama";
import test from "tape";
import {
  CreateMewInput,
  FeedMew,
  FeedMewsInRecentTimePeriods,
  LinkTargetName,
  MewTypeName,
} from "../../../ui/src/types/types.js";
import { clutterHapp, sleep } from "../utils.js";
import dayjs from "dayjs";

test("Mew must not be longer than 200 chars", async (t) => {
  const scenario = new Scenario();
  try {
    const alice = await scenario.addPlayerWithApp(clutterHapp);
    const aliceCallMewsZome = getZomeCaller(alice.cells[0], "mews");

    const createMewInput: CreateMewInput = {
      mewType: {
        original: null,
      },
      text: new Array(200).fill("a").join(""),
    };
    const mewHash: ActionHash = await aliceCallMewsZome(
      "create_mew",
      createMewInput
    );
    t.deepEqual(
      mewHash.slice(0, 3),
      Buffer.from([132, 41, 36]),
      "alice created a mew of valid length"
    );

    createMewInput.text = new Array(201).fill("a").join("");
    try {
      await aliceCallMewsZome("create_mew", createMewInput);
      t.fail("mew content longer than 200 chars is valid");
    } catch (error) {
      t.ok("mew content longer than 200 chars is invalid");
    }
  } catch (error) {
    console.error("error", error);
  }
  await scenario.cleanUp();
});

test("Following oneself should fail", async (t) => {
  const scenario = new Scenario();
  const alice = await scenario.addPlayerWithApp(clutterHapp);

  try {
    await alice.cells[0].callZome({ zome_name: "mews", fn_name: "follow" });
    t.fail();
  } catch (e) {
    const myFollowers: AgentPubKey[] = await alice.cells[0].callZome({
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
  const [alice, bob] = await scenario.addPlayersWithApps([
    { appBundleSource: clutterHapp },
    { appBundleSource: clutterHapp },
  ]);

  const aliceCallMewsZome = getZomeCaller(alice.cells[0], "mews");
  const bobCallMewsZome = getZomeCaller(bob.cells[0], "mews");

  await scenario.shareAllAgents();

  const aliceFollowersInitial: AgentPubKey[] = await aliceCallMewsZome(
    "my_followers"
  );
  t.ok(aliceFollowersInitial.length === 0, "alice has no followers");

  const aliceMyFollowingInitial: AgentPubKey[] = await aliceCallMewsZome(
    "my_following"
  );
  t.ok(aliceMyFollowingInitial.length === 0, "alice is not following anyone");

  // bob starts following alice
  await bobCallMewsZome("follow", alice.agentPubKey);
  await pause(1000);

  const aliceFollowers: AgentPubKey[] = await aliceCallMewsZome("my_followers");
  t.deepEqual(aliceFollowers, [bob.agentPubKey], "bob follows alice");

  const followersOfAlice: AgentPubKey[] = await aliceCallMewsZome(
    "followers",
    alice.agentPubKey
  );
  t.deepEqual(
    followersOfAlice,
    [bob.agentPubKey],
    "bob is a follower of alice"
  );

  const bobMyFollowing = await bobCallMewsZome("my_following", null);
  t.deepEqual(bobMyFollowing, [alice.agentPubKey], "bob is following alice");

  const bobMyFollowers: AgentPubKey[] = await bobCallMewsZome("my_followers");
  t.ok(bobMyFollowers.length === 0, "bob has no followers");

  const agentsFollowingAlice: AgentPubKey[] = await bobCallMewsZome(
    "following",
    bob.agentPubKey
  );
  t.deepEqual(
    agentsFollowingAlice,
    [alice.agentPubKey],
    "bob is a follower of alice"
  );

  await scenario.cleanUp();
});

test("Mews by", async (t) => {
  const scenario = new Scenario();
  const [alice, bob] = await scenario.addPlayersWithApps([
    { appBundleSource: clutterHapp },
    { appBundleSource: clutterHapp },
  ]);
  const aliceCallMewsZome = getZomeCaller(alice.cells[0], "mews");
  const bobCallMewsZome = getZomeCaller(bob.cells[0], "mews");

  await scenario.shareAllAgents();

  const originalMewContent = "test-mew";
  const originalMewInput: CreateMewInput = {
    mewType: { [MewTypeName.Original]: null },
    text: originalMewContent,
  };
  const entryHeaderHash: ActionHash = await aliceCallMewsZome(
    "create_mew",
    originalMewInput
  );
  t.deepEqual(
    entryHeaderHash.slice(0, 3),
    Buffer.from([132, 41, 36]),
    "alice created a valid mew"
  );

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

  await pause(1000);

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
  const alice = await scenario.addPlayerWithApp(clutterHapp);
  const aliceCallMewsZome = getZomeCaller(alice.cells[0], "mews");

  const mewContent =
    "My Mew with #hashtag #سعيدة #😃😃😃 and $cashtag and @mention";
  const createMewInput: CreateMewInput = {
    mewType: {
      original: null,
    },
    text: mewContent,
    links: [{ [LinkTargetName.Mention]: alice.agentPubKey }],
  };

  const mewHash: ActionHash = await aliceCallMewsZome(
    "create_mew",
    createMewInput
  );
  t.deepEqual(
    mewHash.slice(0, 3),
    Buffer.from([132, 41, 36]),
    "alice created a valid mew"
  );

  await pause(1000);

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
    alice.agentPubKey
  );
  t.ok(mentionedMews.length === 1, "one mew with mention");

  await scenario.cleanUp();
});

test("Search - should return hashtags and cashtags", async (t) => {
  const scenario = new Scenario();
  const alice = await scenario.addPlayerWithApp(clutterHapp);
  const aliceCallMewsZome = getZomeCaller(alice.cells[0], "mews");

  const mewContent =
    "My Mew with #hashtag #سعيدة #😃😃😃 and $cashtag and @mention";
  const createMewInput: CreateMewInput = {
    mewType: {
      original: null,
    },
    text: mewContent,
    links: [{ [LinkTargetName.Mention]: alice.agentPubKey }],
  };

  const mewHash: ActionHash = await aliceCallMewsZome(
    "create_mew",
    createMewInput
  );
  t.deepEqual(
    mewHash.slice(0, 3),
    Buffer.from([132, 41, 36]),
    "alice created a valid mew"
  );

  await pause(1000);

  const hashtags: string[] = await aliceCallMewsZome("search_hashtags", "has");
  t.ok(hashtags.length === 1, "one hashtag");
  t.equal(hashtags[0], "hashtag", "hashtag search result matches");

  const arabicHashtags: string[] = await aliceCallMewsZome(
    "search_hashtags",
    "سعيدة"
  );
  t.ok(arabicHashtags.length === 1, "one arabic hashtag");
  t.equal(arabicHashtags[0], "سعيدة", "hashtag search result matches");

  // get hashtag containing emojis -- invalid hashtag!
  const emojiHashtags: string[] = await aliceCallMewsZome(
    "search_hashtags",
    "😃😃😃"
  );
  t.ok(emojiHashtags.length === 0, "no emoji hashtags");

  const cashtags: string[] = await aliceCallMewsZome("search_cashtags", "cas");
  t.ok(cashtags.length === 1, "one cashtag");
  t.equal(cashtags[0], "cashtag", "hashtag search result matches");
  await scenario.cleanUp();
});

test("Mews Feed - should include own mews", async (t) => {
  const scenario = new Scenario();
  const alice = await scenario.addPlayerWithApp(clutterHapp);
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

test("Mews Feed - should include mews of followed agent", async (t) => {
  const scenario = new Scenario();
  const [alice, bob] = await scenario.addPlayersWithApps([
    { appBundleSource: clutterHapp },
    { appBundleSource: clutterHapp },
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

test("Mews Feed - should not include mews of non-followed agent", async (t) => {
  const scenario = new Scenario();
  const [alice, bob, carol] = await scenario.addPlayersWithApps([
    { appBundleSource: clutterHapp },
    { appBundleSource: clutterHapp },
    { appBundleSource: clutterHapp },
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
  await pause(1000);

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

test("Mews Feed - un-following should exclude agent's mews from feed", async (t) => {
  const scenario = new Scenario();
  const [alice, bob] = await scenario.addPlayersWithApps([
    { appBundleSource: clutterHapp },
    { appBundleSource: clutterHapp },
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
  await pause(1000);

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

test("Mews Feed - should be ordered by timestamp in descending order", async (t) => {
  const scenario = new Scenario();
  const [alice, bob, carol] = await scenario.addPlayersWithApps([
    { appBundleSource: clutterHapp },
    { appBundleSource: clutterHapp },
    { appBundleSource: clutterHapp },
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

  await pause(1000);

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

test("Mew Interaction - liked mew should be included in my likes", async (t) => {
  const scenario = new Scenario();
  const alice = await scenario.addPlayerWithApp(clutterHapp);
  const aliceCallMewsZome = getZomeCaller(alice.cells[0], "mews");

  const aliceMewContent = "alice-test-mew";
  const aliceMewInput: CreateMewInput = {
    mewType: { [MewTypeName.Original]: null },
    text: aliceMewContent,
  };
  const mewHeaderHash: ActionHash = await aliceCallMewsZome(
    "create_mew",
    aliceMewInput
  );

  await aliceCallMewsZome("lick_mew", mewHeaderHash);

  const myLikes: ActionHash[] = await aliceCallMewsZome("my_licks", null);
  t.equal(myLikes.length, 1, "alice has 1 like");
  t.deepEqual(myLikes[0], mewHeaderHash, "alice's like is the mew she created");

  await scenario.cleanUp();
});

test("Mew Interaction - unliked mew should be excluded from my likes", async (t) => {
  const scenario = new Scenario();
  const alice = await scenario.addPlayerWithApp(clutterHapp);
  const aliceCallMewsZome = getZomeCaller(alice.cells[0], "mews");

  const aliceMewContent = "alice-test-mew";
  const aliceMewInput: CreateMewInput = {
    mewType: { [MewTypeName.Original]: null },
    text: aliceMewContent,
  };
  const mewHeaderHash: ActionHash = await aliceCallMewsZome(
    "create_mew",
    aliceMewInput
  );

  await aliceCallMewsZome("lick_mew", mewHeaderHash);
  await aliceCallMewsZome("unlick_mew", mewHeaderHash);

  const myLikes: ActionHash[] = await aliceCallMewsZome("my_licks", null);
  t.equal(myLikes.length, 0, "alice has no likes");

  await scenario.cleanUp();
});

test("Mew Interaction - replying to a mew should be linked correctly", async (t) => {
  const scenario = new Scenario();
  const alice = await scenario.addPlayerWithApp(clutterHapp);
  const aliceCallMewsZome = getZomeCaller(alice.cells[0], "mews");

  const aliceMewContent = "alice-test-mew";
  const aliceMewInput: CreateMewInput = {
    mewType: { [MewTypeName.Original]: null },
    text: aliceMewContent,
  };
  const mewHeaderHash: ActionHash = await aliceCallMewsZome(
    "create_mew",
    aliceMewInput
  );

  const aliceReplyContent = "alice-test-reply";
  const aliceReplyInput: CreateMewInput = {
    mewType: { [MewTypeName.Reply]: mewHeaderHash },
    text: aliceReplyContent,
  };
  const replyHeaderHash: ActionHash = await aliceCallMewsZome(
    "create_mew",
    aliceReplyInput
  );

  const replyMew: FeedMew = await aliceCallMewsZome(
    "get_feed_mew_and_context",
    replyHeaderHash
  );
  t.ok(MewTypeName.Reply in replyMew.mew.mewType, "mew is a reply");
  t.equal(
    replyMew.mew.content?.text,
    aliceReplyContent,
    "reply is alice's reply"
  );

  const originalMew: FeedMew = await aliceCallMewsZome(
    "get_feed_mew_and_context",
    mewHeaderHash
  );
  t.ok(
    MewTypeName.Original in originalMew.mew.mewType,
    "mew is an original mew"
  );
  t.equal(originalMew.mew.content?.text, aliceMewContent, "mew is alice's mew");
  t.ok(originalMew.replies.length === 1, "original mew has 1 reply");
  t.deepEqual(
    originalMew.replies[0],
    replyHeaderHash,
    "original mew's reply is alice's reply"
  );

  await scenario.cleanUp();
});

test("Mew Interaction - mewmewing a mew should be linked correctly", async (t) => {
  const scenario = new Scenario();
  const alice = await scenario.addPlayerWithApp(clutterHapp);
  const aliceCallMewsZome = getZomeCaller(alice.cells[0], "mews");

  const aliceMewContent = "alice-test-mew";
  const aliceMewInput: CreateMewInput = {
    mewType: { [MewTypeName.Original]: null },
    text: aliceMewContent,
  };
  const mewHeaderHash: ActionHash = await aliceCallMewsZome(
    "create_mew",
    aliceMewInput
  );

  const aliceMewmewInput: CreateMewInput = {
    mewType: { [MewTypeName.MewMew]: mewHeaderHash },
    text: null,
  };
  const mewmewHeaderHash: ActionHash = await aliceCallMewsZome(
    "create_mew",
    aliceMewmewInput
  );

  const mewmew: FeedMew = await aliceCallMewsZome(
    "get_feed_mew_and_context",
    mewmewHeaderHash
  );
  t.ok(MewTypeName.MewMew in mewmew.mew.mewType, "mew is a mewmew");
  t.equal(mewmew.mew.content, null, "mewmew is alice's mewmew");

  const originalMew: FeedMew = await aliceCallMewsZome(
    "get_feed_mew_and_context",
    mewHeaderHash
  );
  t.ok(
    MewTypeName.Original in originalMew.mew.mewType,
    "mew is an original mew"
  );
  t.equal(originalMew.mew.content?.text, aliceMewContent, "mew is alice's mew");
  t.ok(originalMew.mewmews.length === 1, "original mew has 1 mewmew");
  t.deepEqual(
    originalMew.mewmews[0],
    mewmewHeaderHash,
    "original mew's mewmew is alice's mewmew"
  );

  await scenario.cleanUp();
});

test("Mew Interaction - quoting a mew should be linked correctly", async (t) => {
  const scenario = new Scenario();
  const alice = await scenario.addPlayerWithApp(clutterHapp);
  const aliceCallMewsZome = getZomeCaller(alice.cells[0], "mews");

  const aliceMewContent = "alice-test-mew";
  const aliceMewInput: CreateMewInput = {
    mewType: { [MewTypeName.Original]: null },
    text: aliceMewContent,
  };
  const mewHeaderHash: ActionHash = await aliceCallMewsZome(
    "create_mew",
    aliceMewInput
  );

  const aliceQuoteText = "alice-test-quote";
  const aliceQuoteInput: CreateMewInput = {
    mewType: { [MewTypeName.Quote]: mewHeaderHash },
    text: aliceQuoteText,
  };
  const quoteHeaderHash: ActionHash = await aliceCallMewsZome(
    "create_mew",
    aliceQuoteInput
  );

  const quote: FeedMew = await aliceCallMewsZome(
    "get_feed_mew_and_context",
    quoteHeaderHash
  );
  t.ok(MewTypeName.Quote in quote.mew.mewType, "mew is a quote");
  t.equal(quote.mew.content?.text, aliceQuoteText, "quote is alice's quote");

  const originalMew: FeedMew = await aliceCallMewsZome(
    "get_feed_mew_and_context",
    mewHeaderHash
  );
  t.ok(
    MewTypeName.Original in originalMew.mew.mewType,
    "mew is an original mew"
  );
  t.equal(originalMew.mew.content?.text, aliceMewContent, "mew is alice's mew");
  t.ok(originalMew.quotes.length === 1, "original mew has 1 quote");
  t.deepEqual(
    originalMew.quotes[0],
    quoteHeaderHash,
    "original mew's quote is alice's quote"
  );

  await scenario.cleanUp();
});

test("Most Licked Mews - should only contain mews created within timespan", async (t) => {
  const scenario = new Scenario();
  const alice = await scenario.addPlayerWithHappBundle(clutterHapp);
  const aliceCallMewsZome = getZomeCaller(alice.cells[0], "mews");

  const mewContent = "test-mew";
  const mewInput: CreateMewInput = {
    mewType: { [MewTypeName.Original]: null },
    text: mewContent,
  };
  const actionHash = await aliceCallMewsZome("create_mew", mewInput);
  await aliceCallMewsZome("lick_mew", actionHash);

  let aliceMewsFeed: FeedMewsInRecentTimePeriods = await aliceCallMewsZome(
    "mews_most_licked",
    {
      count: 5,
      current_timestamp: dayjs().valueOf() * 1000,
    }
  );
  t.ok(
    aliceMewsFeed.day.length === 1,
    "alice's most_licked_mews_recently includes her mew"
  );
  t.equal(
    aliceMewsFeed.day[0].mew.content?.text,
    mewContent,
    "mew content matches"
  );

  await sleep(10000);

  aliceMewsFeed = await aliceCallMewsZome("mews_most_licked", {
    count: 5,
    current_timestamp: dayjs().add(1, "day").valueOf() * 1000,
  });

  t.ok(
    aliceMewsFeed.day.length === 0 &&
      aliceMewsFeed.week.length === 1 &&
      aliceMewsFeed.month.length === 1 &&
      aliceMewsFeed.year.length === 1,
    "alice's mews_most_licked day does not include older mews"
  );

  aliceMewsFeed = await aliceCallMewsZome("mews_most_licked", {
    count: 5,
    current_timestamp: dayjs().add(1, "week").valueOf() * 1000,
  });

  t.ok(
    aliceMewsFeed.day.length === 0 &&
      aliceMewsFeed.week.length === 0 &&
      aliceMewsFeed.month.length === 1 &&
      aliceMewsFeed.year.length === 1,
    "alice's mews_most_licked week does not include older mews"
  );

  aliceMewsFeed = await aliceCallMewsZome("mews_most_licked", {
    count: 5,
    current_timestamp: dayjs().add(32, "days").valueOf() * 1000,
  });

  t.ok(
    aliceMewsFeed.day.length === 0 &&
      aliceMewsFeed.week.length === 0 &&
      aliceMewsFeed.month.length === 0 &&
      aliceMewsFeed.year.length === 1,
    "alice's mews_most_licked month does not include older mews"
  );

  aliceMewsFeed = await aliceCallMewsZome("mews_most_licked", {
    count: 5,
    current_timestamp: dayjs().add(1, "year").add(1, "day").valueOf() * 1000,
  });

  t.ok(
    aliceMewsFeed.day.length === 0 &&
      aliceMewsFeed.week.length === 0 &&
      aliceMewsFeed.month.length === 0 &&
      aliceMewsFeed.year.length === 0,
    "alice's mews_most_licked year does not include older mews"
  );

  await scenario.cleanUp();
});

test("Most Licked Mews - should only contain licked mews", async (t) => {
  const scenario = new Scenario();
  const alice = await scenario.addPlayerWithHappBundle(clutterHapp);
  const aliceCallMewsZome = getZomeCaller(alice.cells[0], "mews");

  const aliceMostLickedMewsInitial: FeedMewsInRecentTimePeriods =
    await aliceCallMewsZome("mews_most_licked", {
      count: 5,
      current_timestamp: Date.now() * 1000,
    });
  t.ok(
    aliceMostLickedMewsInitial.day.length === 0,
    "mews_most_licked day is initially empty"
  );
  t.ok(
    aliceMostLickedMewsInitial.week.length === 0,
    "mews_most_licked week is initially empty"
  );
  t.ok(
    aliceMostLickedMewsInitial.month.length === 0,
    "mews_most_licked month is initially empty"
  );
  t.ok(
    aliceMostLickedMewsInitial.year.length === 0,
    "mews_most_licked year is initially empty"
  );

  const mewContent = "test-mew";
  const mewInput: CreateMewInput = {
    mewType: { [MewTypeName.Original]: null },
    text: mewContent,
  };
  await aliceCallMewsZome("create_mew", mewInput);

  const aliceMewsFeed: FeedMewsInRecentTimePeriods = await aliceCallMewsZome(
    "mews_most_licked",
    {
      count: 5,
      current_timestamp: Date.now() * 1000,
    }
  );
  t.ok(
    aliceMewsFeed.day.length === 0,
    "alice's mews_most_licked day does not include her mew"
  );
  t.ok(
    aliceMewsFeed.week.length === 0,
    "alice's mews_most_licked week does not include her mew"
  );
  t.ok(
    aliceMewsFeed.month.length === 0,
    "alice's mews_most_licked month does not include her mew"
  );
  t.ok(
    aliceMewsFeed.year.length === 0,
    "alice's mews_most_licked year does not include her mew"
  );

  await scenario.cleanUp();
});

test("Most Licked Mews - should include mews of non-followed agent", async (t) => {
  const scenario = new Scenario();
  const [alice, bob] = await scenario.addPlayersWithHappBundles([
    { appBundleSource: clutterHapp },
    { appBundleSource: clutterHapp },
  ]);
  await scenario.shareAllAgents();
  const aliceCallMewsZome = getZomeCaller(alice.cells[0], "mews");
  const bobCallMewsZome = getZomeCaller(bob.cells[0], "mews");

  const mewContent = "test-mew";
  const mewInput: CreateMewInput = {
    mewType: { [MewTypeName.Original]: null },
    text: mewContent,
  };
  const actionHash = await aliceCallMewsZome("create_mew", mewInput);
  await aliceCallMewsZome("lick_mew", actionHash);

  await pause(300);

  const bobMewsFeedInitial: FeedMewsInRecentTimePeriods = await bobCallMewsZome(
    "mews_most_licked",
    {
      count: 5,
      current_timestamp: Date.now() * 1000,
    }
  );
  t.ok(
    bobMewsFeedInitial.day.length === 1,
    `bob's mews_most_licked day includes 1 mew`
  );
  t.ok(
    bobMewsFeedInitial.week.length === 1,
    `bob's mews_most_licked week includes 1 mew`
  );
  t.ok(
    bobMewsFeedInitial.month.length === 1,
    `bob's mews_most_licked month includes 1 mew`
  );
  t.ok(
    bobMewsFeedInitial.year.length === 1,
    `bob's mews_most_licked year includes 1 mew`
  );

  await scenario.cleanUp();
});

test("Most Licked Mews - should be ordered number of licks in descending order", async (t) => {
  const scenario = new Scenario();
  const [alice, bob, carol] = await scenario.addPlayersWithHappBundles([
    { appBundleSource: clutterHapp },
    { appBundleSource: clutterHapp },
    { appBundleSource: clutterHapp },
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
  const secondMewActionHash = await bobCallMewsZome(
    "create_mew",
    secondMewInput
  );

  const thirdMewContent = "third-test-mew";
  const thirdMewInput: CreateMewInput = {
    mewType: { [MewTypeName.Original]: null },
    text: thirdMewContent,
  };
  const thirdMewActionHash = await carolCallMewsZome(
    "create_mew",
    thirdMewInput
  );

  const fourthMewContent = "fourth-test-mew";
  const fourthMewInput: CreateMewInput = {
    mewType: { [MewTypeName.Original]: null },
    text: fourthMewContent,
  };
  const fourthMewActionHash = await aliceCallMewsZome(
    "create_mew",
    fourthMewInput
  );

  // alice, bob & carol lick the firstMew
  await aliceCallMewsZome("lick_mew", fourthMewActionHash);
  await bobCallMewsZome("lick_mew", fourthMewActionHash);
  await carolCallMewsZome("lick_mew", fourthMewActionHash);

  // bob & carol lick the secondMew
  await bobCallMewsZome("lick_mew", secondMewActionHash);
  await carolCallMewsZome("lick_mew", secondMewActionHash);

  // alice licks the thirdMew
  await bobCallMewsZome("lick_mew", thirdMewActionHash);

  await pause(100);

  const aliceMostLickedMews: FeedMewsInRecentTimePeriods =
    await aliceCallMewsZome("mews_most_licked", {
      count: 5,
      current_timestamp: Date.now() * 1000,
    });

  t.ok(
    aliceMostLickedMews.day.length === 3,
    "alice's mews_most_licked day feed includes all 3 licked mews"
  );
  t.ok(
    aliceMostLickedMews.week.length === 3,
    "alice's mews_most_licked week feed includes all 3 licked mews"
  );
  t.ok(
    aliceMostLickedMews.month.length === 3,
    "alice's mews_most_licked month feed includes all 3 licked mews"
  );
  t.ok(
    aliceMostLickedMews.year.length === 3,
    "alice's mews_most_licked year feed includes all 3 licked mews"
  );
  t.equal(
    aliceMostLickedMews.day[0].mew.content?.text,
    fourthMewContent,
    "mew 1 in feed is fourth mew"
  );
  t.equal(
    aliceMostLickedMews.day[1].mew.content?.text,
    secondMewContent,
    "mew 2 in feed is second mew"
  );
  t.equal(
    aliceMostLickedMews.day[2].mew.content?.text,
    thirdMewContent,
    "mew 3 in feed is third mew"
  );

  await scenario.cleanUp();
});
