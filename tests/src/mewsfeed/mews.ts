import { ActionHash, AgentPubKey, Record } from "@holochain/client";
import { getZomeCaller, pause, runScenario } from "@holochain/tryorama";
import test from "tape";
import {
  FeedMew,
  LinkTargetName,
  Mew,
  MewTypeName,
} from "../../../ui/src/types/types.js";
import { mewsfeedHapp, mewsfeedHappNoLengthLimits } from "../utils.js";

test("Mew must not be longer than DNA property mew_characters_max chars", async (t) => {
  await runScenario(
    async (scenario) => {
      const alice = await scenario.addPlayerWithApp(mewsfeedHapp);
      const aliceCallMewsZome = getZomeCaller(alice.cells[0], "mews");

      const createMewInput: Mew = {
        text: new Array(200).fill("a").join(""),
        links: [],
        mew_type: { [MewTypeName.Original]: null },
      };
      const mewRecord: Record = await aliceCallMewsZome(
        "create_mew",
        createMewInput,
        60000
      );
      t.deepEqual(
        mewRecord.signed_action.hashed.hash.slice(0, 3),
        Buffer.from([132, 41, 36]),
        "alice created a mew of valid length"
      );

      createMewInput.text = new Array(201).fill("a").join("");
      try {
        await aliceCallMewsZome("create_mew", createMewInput, 60000);
        t.fail("mew content longer than mew_characters_max is valid");
      } catch (error) {
        t.pass("mew content longer than mew_characters_max is invalid");
      }
    },
    true,
    { timeout: 60000 }
  );
});

test("Mew must not be shorter than DNA property mew_characters_min chars", async (t) => {
  await runScenario(
    async (scenario) => {
      const alice = await scenario.addPlayerWithApp(mewsfeedHapp);
      const aliceCallMewsZome = getZomeCaller(alice.cells[0], "mews");

      const createMewInput: Mew = {
        text: new Array(10).fill("a").join(""),
        links: [],
        mew_type: { [MewTypeName.Original]: null },
      };
      const mewRecord: Record = await aliceCallMewsZome(
        "create_mew",
        createMewInput,
        60000
      );
      t.deepEqual(
        mewRecord.signed_action.hashed.hash.slice(0, 3),
        Buffer.from([132, 41, 36]),
        "alice created a mew of valid length"
      );

      createMewInput.text = new Array(2).fill("a").join("");
      try {
        await aliceCallMewsZome("create_mew", createMewInput, 60000);
        t.fail("mew content shorter than mew_characters_min is valid");
      } catch (error) {
        t.pass("mew content shorter than mew_characters_min is invalid");
      }
    },
    true,
    { timeout: 60000 }
  );
});

test("Mew can be any length if DNA property mew_charactres_min and mew_characters_max not set", async (t) => {
  await runScenario(
    async (scenario) => {
      const alice = await scenario.addPlayerWithApp(mewsfeedHappNoLengthLimits);
      const aliceCallMewsZome = getZomeCaller(alice.cells[0], "mews");

      // 0 charactres
      const createMewInput2: Mew = {
        text: "",
        links: [],
        mew_type: { [MewTypeName.Original]: null },
      };
      const mewRecord2: Record = await aliceCallMewsZome(
        "create_mew",
        createMewInput2,
        60000
      );
      t.deepEqual(
        mewRecord2.signed_action.hashed.hash.slice(0, 3),
        Buffer.from([132, 41, 36]),
        "alice created a mew of valid length 0"
      );

      // 1000 charactres
      const createMewInput3: Mew = {
        text: new Array(1000).fill("a").join(""),
        links: [],
        mew_type: { [MewTypeName.Original]: null },
      };
      const mewRecord3: Record = await aliceCallMewsZome(
        "create_mew",
        createMewInput3,
        60000
      );
      t.deepEqual(
        mewRecord3.signed_action.hashed.hash.slice(0, 3),
        Buffer.from([132, 41, 36]),
        "alice created a mew of valid length 1000"
      );
    },
    true,
    { timeout: 60000 }
  );
});

test("Mews by", async (t) => {
  await runScenario(
    async (scenario) => {
      const [alice, bob] = await scenario.addPlayersWithApps([
        { appBundleSource: mewsfeedHapp },
        { appBundleSource: mewsfeedHapp },
      ]);
      const aliceCallMewsZome = getZomeCaller(alice.cells[0], "mews");
      const bobCallMewsZome = getZomeCaller(bob.cells[0], "mews");

      await scenario.shareAllAgents();

      const originalMewContent = "test-mew";
      const originalMewInput: Mew = {
        text: originalMewContent,
        links: [],
        mew_type: { [MewTypeName.Original]: null },
      };
      const mewRecord: Record = await aliceCallMewsZome(
        "create_mew",
        originalMewInput,
        60000
      );
      t.deepEqual(
        mewRecord.signed_action.hashed.hash.slice(0, 3),
        Buffer.from([132, 41, 36]),
        "alice created a valid mew"
      );

      const mewsByAlice: FeedMew[] = await aliceCallMewsZome(
        "get_agent_mews_with_context",
        alice.agentPubKey,
        60000
      );
      t.ok(mewsByAlice.length === 1, "mews by alice contains 1 mew");
      t.equal(
        mewsByAlice[0].mew.text,
        originalMewContent,
        "mews by alice includes her mew"
      );

      const mewsByBob: FeedMew[] = await bobCallMewsZome(
        "get_agent_mews_with_context",
        bob.agentPubKey,
        60000
      );
      t.ok(mewsByBob.length === 0, "mews by bob is empty");

      await pause(1000);

      const mewsByAliceInBobsCell: FeedMew[] = await bobCallMewsZome(
        "get_agent_mews_with_context",
        alice.agentPubKey,
        60000
      );
      t.ok(mewsByAliceInBobsCell.length === 1, "1 mew by alice in bob's cell");
      t.equal(
        mewsByAliceInBobsCell[0].mew.text,
        originalMewContent,
        "mews by alice in bob's cell includes her mew"
      );
    },
    true,
    { timeout: 60000 }
  );
});

test("Hashtag, cashtag and mention", async (t) => {
  await runScenario(
    async (scenario) => {
      const alice = await scenario.addPlayerWithApp(mewsfeedHapp);
      const aliceCallMewsZome = getZomeCaller(alice.cells[0], "mews");

      const mewContent =
        "My Mew with #hashtag #سعيدة #😃😃😃 and $cashtag and @mention";
      const createMewInput: Mew = {
        text: mewContent,
        links: [{ [LinkTargetName.Mention]: alice.agentPubKey }],
        mew_type: { [MewTypeName.Original]: null },
      };

      const mewRecord: Record = await aliceCallMewsZome(
        "create_mew",
        createMewInput,
        60000
      );
      t.deepEqual(
        mewRecord.signed_action.hashed.hash.slice(0, 3),
        Buffer.from([132, 41, 36]),
        "alice created a valid mew"
      );

      await pause(1000);

      const hashtaggedMews: FeedMew[] = await aliceCallMewsZome(
        "get_mews_for_hashtag_with_context",
        "#hashtag",
        60000
      );
      t.ok(hashtaggedMews.length === 1, "one mew with hashtag");
      t.equal(hashtaggedMews[0].mew.text, mewContent, "mew content matches");

      const arabicHashtaggedMews: FeedMew[] = await aliceCallMewsZome(
        "get_mews_for_hashtag_with_context",
        "#سعيدة",
        60000
      );
      t.ok(arabicHashtaggedMews.length === 1, "one mew with arabic hashtag");
      t.equal(
        arabicHashtaggedMews[0].mew.text,
        mewContent,
        "mew content matches"
      );

      // get hashtag containing emojis -- invalid hashtag!
      const emojiHashtaggedMews: FeedMew[] = await aliceCallMewsZome(
        "get_mews_for_hashtag_with_context",
        "#😃😃😃",
        60000
      );
      t.ok(emojiHashtaggedMews.length === 0, "no mew with emoji hashtag");

      const cashtaggedMews: FeedMew[] = await aliceCallMewsZome(
        "get_mews_for_cashtag_with_context",
        "$cashtag",
        60000
      );
      t.ok(cashtaggedMews.length === 1, "one mew with cashtag");

      const mentionedMews: FeedMew[] = await aliceCallMewsZome(
        "get_mews_for_mention_with_context",
        alice.agentPubKey,
        60000
      );
      t.ok(mentionedMews.length === 1, "one mew with mention");
    },
    true,
    { timeout: 60000 }
  );
});

test("Search - should return hashtags and cashtags", async (t) => {
  await runScenario(
    async (scenario) => {
      const alice = await scenario.addPlayerWithApp(mewsfeedHapp);
      const aliceCallMewsZome = getZomeCaller(alice.cells[0], "mews");

      const mewContent =
        "My Mew with #hashtag #سعيدة #😃😃😃 and $cashtag and @mention";
      const createMewInput: Mew = {
        text: mewContent,
        links: [{ [LinkTargetName.Mention]: alice.agentPubKey }],
        mew_type: { [MewTypeName.Original]: null },
      };

      const mewRecord: Record = await aliceCallMewsZome(
        "create_mew",
        createMewInput,
        60000
      );
      t.deepEqual(
        mewRecord.signed_action.hashed.hash.slice(0, 3),
        Buffer.from([132, 41, 36]),
        "alice created a valid mew"
      );

      await pause(1000);

      const hashtags: string[] = await aliceCallMewsZome(
        "search_hashtags",
        "has",
        60000
      );
      t.ok(hashtags.length === 1, "one hashtag");
      t.equal(hashtags[0], "hashtag", "hashtag search result matches");

      const arabicHashtags: string[] = await aliceCallMewsZome(
        "search_hashtags",
        "سعيدة",
        60000
      );
      t.ok(arabicHashtags.length === 1, "one arabic hashtag");
      t.equal(arabicHashtags[0], "سعيدة", "hashtag search result matches");

      // get hashtag containing emojis -- invalid hashtag!
      const emojiHashtags: string[] = await aliceCallMewsZome(
        "search_hashtags",
        "😃😃😃",
        60000
      );
      t.ok(emojiHashtags.length === 0, "no emoji hashtags");

      const cashtags: string[] = await aliceCallMewsZome(
        "search_cashtags",
        "cas",
        60000
      );
      t.ok(cashtags.length === 1, "one cashtag");
      t.equal(cashtags[0], "cashtag", "hashtag search result matches");
    },
    true,
    { timeout: 60000 }
  );
});

test("Mews Feed - should include own mews", async (t) => {
  await runScenario(
    async (scenario) => {
      const alice = await scenario.addPlayerWithApp(mewsfeedHapp);
      const aliceCallMewsZome = getZomeCaller(alice.cells[0], "mews");

      const aliceMewsFeedInitial: FeedMew[] = await aliceCallMewsZome(
        "get_my_followees_mews_with_context",
        null,
        60000
      );
      t.ok(
        aliceMewsFeedInitial.length === 0,
        "alice's mews feed is initially empty"
      );

      const mewContent = "test-mew";
      const mewInput: Mew = {
        text: mewContent,
        links: [],
        mew_type: { [MewTypeName.Original]: null },
      };
      await aliceCallMewsZome("create_mew", mewInput, 60000);

      const aliceMewsFeed: FeedMew[] = await aliceCallMewsZome(
        "get_my_followees_mews_with_context",
        null,
        60000
      );
      t.ok(aliceMewsFeed.length === 1, "alice's mews feed includes her mew");
      t.equal(aliceMewsFeed[0].mew.text, mewContent, "mew content matches");
    },
    true,
    { timeout: 60000 }
  );
});

test("Mews Feed - should include mews of followed agent", async (t) => {
  await runScenario(
    async (scenario) => {
      const [alice, bob] = await scenario.addPlayersWithApps([
        { appBundleSource: mewsfeedHapp },
        { appBundleSource: mewsfeedHapp },
      ]);
      await scenario.shareAllAgents();
      const aliceCallMewsZome = getZomeCaller(alice.cells[0], "mews");
      const bobCallMewsZome = getZomeCaller(bob.cells[0], "mews");

      const mewContent = "test-mew";
      const mewInput: Mew = {
        text: mewContent,
        links: [],
        mew_type: { [MewTypeName.Original]: null },
      };
      await aliceCallMewsZome("create_mew", mewInput, 60000);

      const bobMewsFeedInitial: FeedMew[] = await bobCallMewsZome(
        "get_my_followees_mews_with_context",
        null,
        60000
      );
      t.ok(
        bobMewsFeedInitial.length === 0,
        "bob's mews feed is initially empty"
      );

      await bob.cells[0].callZome({
        zome_name: "follows",
        fn_name: "follow",
        payload: alice.agentPubKey,
      });

      const bobMewsFeed: FeedMew[] = await bobCallMewsZome(
        "get_my_followees_mews_with_context",
        null,
        60000
      );
      t.ok(bobMewsFeed.length === 1, "bob's mews feed includes 1 mew");
      t.equal(
        bobMewsFeed[0].mew.text,
        mewContent,
        "mew content in bob's mews feed matches alice's mew content"
      );
    },
    true,
    { timeout: 60000 }
  );
});

test("Mews Feed - should not include mews of non-followed agent", async (t) => {
  await runScenario(
    async (scenario) => {
      const [alice, bob, carol] = await scenario.addPlayersWithApps([
        { appBundleSource: mewsfeedHapp },
        { appBundleSource: mewsfeedHapp },
        { appBundleSource: mewsfeedHapp },
      ]);
      await scenario.shareAllAgents();
      const aliceCallMewsZome = getZomeCaller(alice.cells[0], "mews");
      const bobCallMewsZome = getZomeCaller(bob.cells[0], "mews");
      const carolCallMewsZome = getZomeCaller(carol.cells[0], "mews");

      const aliceMewContent = "alice-test-mew";
      const aliceMewInput: Mew = {
        text: aliceMewContent,
        links: [],
        mew_type: { [MewTypeName.Original]: null },
      };
      await aliceCallMewsZome("create_mew", aliceMewInput, 60000);

      const carolMewContent = "carol-test-mew";
      const carolMewInput: Mew = {
        text: carolMewContent,
        links: [],
        mew_type: { [MewTypeName.Original]: null },
      };
      await carolCallMewsZome("create_mew", carolMewInput, 60000);

      await bob.cells[0].callZome({
        zome_name: "follows",
        fn_name: "follow",
        payload: alice.agentPubKey,
      });
      await pause(1000);

      const bobMewsFeed: FeedMew[] = await bobCallMewsZome(
        "get_my_followees_mews_with_context",
        null,
        60000
      );
      t.ok(bobMewsFeed.length === 1, "bob's mews feed includes 1 mew");
      t.equal(
        bobMewsFeed[0].mew.text,
        aliceMewContent,
        "mew content in bob's mews feed matches alice's mew content"
      );
    },
    true,
    { timeout: 60000 }
  );
});

test("Mews Feed - un-following should exclude agent's mews from feed", async (t) => {
  await runScenario(
    async (scenario) => {
      const [alice, bob] = await scenario.addPlayersWithApps([
        { appBundleSource: mewsfeedHapp },
        { appBundleSource: mewsfeedHapp },
      ]);
      await scenario.shareAllAgents();
      const aliceCallMewsZome = getZomeCaller(alice.cells[0], "mews");
      const bobCallMewsZome = getZomeCaller(bob.cells[0], "mews");

      const aliceMewContent = "alice-test-mew";
      const aliceMewInput: Mew = {
        text: aliceMewContent,
        links: [],
        mew_type: { [MewTypeName.Original]: null },
      };
      await aliceCallMewsZome("create_mew", aliceMewInput, 60000);

      await bob.cells[0].callZome({
        zome_name: "follows",
        fn_name: "follow",
        payload: alice.agentPubKey,
      });
      await pause(1000);

      const bobMewsFeedWhenFollowing: FeedMew[] = await bobCallMewsZome(
        "get_my_followees_mews_with_context",
        null,
        60000
      );
      t.ok(
        bobMewsFeedWhenFollowing.length === 1,
        "bob's mews feed includes 1 mew"
      );
      t.equal(
        bobMewsFeedWhenFollowing[0].mew.text,
        aliceMewContent,
        "mew content in bob's mews feed matches alice's mew content"
      );

      await bob.cells[0].callZome({
        zome_name: "follows",
        fn_name: "unfollow",
        payload: alice.agentPubKey,
      });

      const bobMewsFeed: FeedMew[] = await bobCallMewsZome(
        "get_my_followees_mews_with_context",
        null,
        60000
      );
      t.ok(bobMewsFeed.length === 0, "bob's mews feed is empty");
    },
    true,
    { timeout: 60000 }
  );
});

test("Mews Feed - should be ordered by timestamp in descending order", async (t) => {
  await runScenario(
    async (scenario) => {
      const [alice, bob, carol] = await scenario.addPlayersWithApps([
        { appBundleSource: mewsfeedHapp },
        { appBundleSource: mewsfeedHapp },
        { appBundleSource: mewsfeedHapp },
      ]);
      await scenario.shareAllAgents();
      const aliceCallMewsZome = getZomeCaller(alice.cells[0], "mews");
      const bobCallMewsZome = getZomeCaller(bob.cells[0], "mews");
      const carolCallMewsZome = getZomeCaller(carol.cells[0], "mews");

      const firstMewContent = "first-test-mew";
      const firstMewInput: Mew = {
        text: firstMewContent,
        links: [],
        mew_type: { [MewTypeName.Original]: null },
      };
      await aliceCallMewsZome("create_mew", firstMewInput, 60000);

      const secondMewContent = "second-test-mew";
      const secondMewInput: Mew = {
        text: secondMewContent,
        links: [],
        mew_type: { [MewTypeName.Original]: null },
      };
      await bobCallMewsZome("create_mew", secondMewInput, 60000);

      const thirdMewContent = "third-test-mew";
      const thirdMewInput: Mew = {
        text: thirdMewContent,
        links: [],
        mew_type: { [MewTypeName.Original]: null },
      };
      await carolCallMewsZome("create_mew", thirdMewInput, 60000);

      const fourthMewContent = "fourth-test-mew";
      const fourthMewInput: Mew = {
        text: fourthMewContent,
        links: [],
        mew_type: { [MewTypeName.Original]: null },
      };
      await aliceCallMewsZome("create_mew", fourthMewInput, 60000);

      // alice starts following bob and carol
      await alice.cells[0].callZome({
        zome_name: "follows",
        fn_name: "follow",
        payload: bob.agentPubKey,
      });
      await alice.cells[0].callZome({
        zome_name: "follows",
        fn_name: "follow",
        payload: carol.agentPubKey,
      });

      await pause(1000);

      const aliceMewsFeed: FeedMew[] = await aliceCallMewsZome(
        "get_my_followees_mews_with_context",
        null,
        60000
      );
      t.ok(aliceMewsFeed.length === 4, "alice's mews feed includes all 4 mews");
      t.equal(
        aliceMewsFeed[0].mew.text,
        fourthMewContent,
        "mew 1 in feed is fourth mew"
      );
      t.equal(
        aliceMewsFeed[1].mew.text,
        thirdMewContent,
        "mew 2 in feed is third mew"
      );
      t.equal(
        aliceMewsFeed[2].mew.text,
        secondMewContent,
        "mew 3 in feed is second mew"
      );
      t.equal(
        aliceMewsFeed[3].mew.text,
        firstMewContent,
        "mew 4 in feed is first mew"
      );
    },
    true,
    { timeout: 60000 }
  );
});

test("Mew Interaction - liked mew should be included in my likes", async (t) => {
  await runScenario(
    async (scenario) => {
      const alice = await scenario.addPlayerWithApp(mewsfeedHapp);
      const aliceCallMewsZome = getZomeCaller(alice.cells[0], "mews");

      const aliceMewContent = "alice-test-mew";
      const aliceMewInput: Mew = {
        text: aliceMewContent,
        links: [],
        mew_type: { [MewTypeName.Original]: null },
      };
      const mewRecord: Record = await aliceCallMewsZome(
        "create_mew",
        aliceMewInput,
        60000
      );

      await aliceCallMewsZome(
        "like_mew",
        mewRecord.signed_action.hashed.hash,
        60000
      );

      const myLikes: ActionHash[] = await aliceCallMewsZome(
        "get_hashes_for_liker",
        alice.agentPubKey,
        60000
      );
      t.equal(myLikes.length, 1, "alice has 1 like");
      t.deepEqual(
        myLikes[0],
        mewRecord.signed_action.hashed.hash,
        "alice's like is the mew she created"
      );
    },
    true,
    { timeout: 60000 }
  );
});

test("Mew Interaction - unliked mew should be excluded from my likes", async (t) => {
  await runScenario(
    async (scenario) => {
      const alice = await scenario.addPlayerWithApp(mewsfeedHapp);
      const aliceCallMewsZome = getZomeCaller(alice.cells[0], "mews");

      const aliceMewContent = "alice-test-mew";
      const aliceMewInput: Mew = {
        text: aliceMewContent,
        links: [],
        mew_type: { [MewTypeName.Original]: null },
      };
      const mewRecord: Record = await aliceCallMewsZome(
        "create_mew",
        aliceMewInput,
        60000
      );

      await aliceCallMewsZome(
        "like_mew",
        mewRecord.signed_action.hashed.hash,
        60000
      );
      await aliceCallMewsZome(
        "unlike_mew",
        mewRecord.signed_action.hashed.hash,
        60000
      );

      const myLikes: ActionHash[] = await aliceCallMewsZome(
        "get_hashes_for_liker",
        alice.agentPubKey,
        60000
      );
      t.equal(myLikes.length, 0, "alice has no likes");
    },
    true,
    { timeout: 60000 }
  );
});

test("Mew Interaction - replying to a mew should be linked correctly", async (t) => {
  await runScenario(
    async (scenario) => {
      const alice = await scenario.addPlayerWithApp(mewsfeedHapp);
      const aliceCallMewsZome = getZomeCaller(alice.cells[0], "mews");

      const aliceMewContent = "alice-test-mew";
      const aliceMewInput: Mew = {
        text: aliceMewContent,
        links: [],
        mew_type: { [MewTypeName.Original]: null },
      };
      const mewRecord: Record = await aliceCallMewsZome(
        "create_mew",
        aliceMewInput,
        60000
      );

      const aliceReplyContent = "alice-test-reply";
      const aliceReplyInput: Mew = {
        text: aliceReplyContent,
        links: [],
        mew_type: { [MewTypeName.Reply]: mewRecord.signed_action.hashed.hash },
      };
      const replyRecord: Record = await aliceCallMewsZome(
        "create_mew",
        aliceReplyInput,
        60000
      );

      const replyMew: FeedMew = await aliceCallMewsZome(
        "get_mew_with_context",
        replyRecord.signed_action.hashed.hash,
        60000
      );
      t.ok(MewTypeName.Reply in replyMew.mew.mew_type, "mew is a reply");
      t.equal(replyMew.mew.text, aliceReplyContent, "reply is alice's reply");

      const originalMew: FeedMew = await aliceCallMewsZome(
        "get_mew_with_context",
        mewRecord.signed_action.hashed.hash,
        60000
      );
      t.ok(
        MewTypeName.Original in originalMew.mew.mew_type,
        "mew is an original mew"
      );
      t.equal(originalMew.mew.text, aliceMewContent, "mew is alice's mew");
      t.ok(originalMew.replies.length === 1, "original mew has 1 reply");
      t.deepEqual(
        originalMew.replies[0],
        replyRecord.signed_action.hashed.hash,
        "original mew's reply is alice's reply"
      );
    },
    true,
    { timeout: 60000 }
  );
});

test("Mew Interaction - mewmewing a mew should be linked correctly", async (t) => {
  await runScenario(
    async (scenario) => {
      const alice = await scenario.addPlayerWithApp(mewsfeedHapp);
      const aliceCallMewsZome = getZomeCaller(alice.cells[0], "mews");

      const aliceMewContent = "alice-test-mew";
      const aliceMewInput: Mew = {
        text: aliceMewContent,
        links: [],
        mew_type: { [MewTypeName.Original]: null },
      };
      const mewRecord: Record = await aliceCallMewsZome(
        "create_mew",
        aliceMewInput,
        60000
      );

      const aliceMewmewInput: Mew = {
        text: "",
        links: [],
        mew_type: { [MewTypeName.Mewmew]: mewRecord.signed_action.hashed.hash },
      };
      const mewmewRecord: Record = await aliceCallMewsZome(
        "create_mew",
        aliceMewmewInput,
        60000
      );

      const mewmew: FeedMew = await aliceCallMewsZome(
        "get_mew_with_context",
        mewmewRecord.signed_action.hashed.hash,
        60000
      );
      t.ok(MewTypeName.Mewmew in mewmew.mew.mew_type, "mew is a mewmew");
      t.equal(mewmew.mew, null, "mewmew is alice's mewmew");

      const originalMew: FeedMew = await aliceCallMewsZome(
        "get_mew_with_context",
        mewRecord.signed_action.hashed.hash,
        60000
      );
      t.ok(
        MewTypeName.Original in originalMew.mew.mew_type,
        "mew is an original mew"
      );
      t.equal(originalMew.mew.text, aliceMewContent, "mew is alice's mew");
      t.ok(originalMew.mewmews.length === 1, "original mew has 1 mewmew");
      t.deepEqual(
        originalMew.mewmews[0],
        mewmewRecord.signed_action.hashed.hash,
        "original mew's mewmew is alice's mewmew"
      );
    },
    true,
    { timeout: 60000 }
  );
});

test("Mew Interaction - quoting a mew should be linked correctly", async (t) => {
  await runScenario(
    async (scenario) => {
      const alice = await scenario.addPlayerWithApp(mewsfeedHapp);
      const aliceCallMewsZome = getZomeCaller(alice.cells[0], "mews");

      const aliceMewContent = "alice-test-mew";
      const aliceMewInput: Mew = {
        text: aliceMewContent,
        links: [],
        mew_type: { [MewTypeName.Original]: null },
      };
      const mewRecord: Record = await aliceCallMewsZome(
        "create_mew",
        aliceMewInput,
        60000
      );

      const aliceQuoteText = "alice-test-quote";
      const aliceQuoteInput: Mew = {
        text: aliceQuoteText,
        links: [],
        mew_type: {
          [MewTypeName.Quote]: mewRecord.signed_action.hashed.hash,
        },
      };
      const quoteRecord: Record = await aliceCallMewsZome(
        "create_mew",
        aliceQuoteInput,
        60000
      );

      const quote: FeedMew = await aliceCallMewsZome(
        "get_mew_with_context",
        quoteRecord.signed_action.hashed.hash,
        60000
      );
      t.ok(MewTypeName.Quote in quote.mew.mew_type, "mew is a quote");
      t.equal(quote.mew.text, aliceQuoteText, "quote is alice's quote");

      const originalMew: FeedMew = await aliceCallMewsZome(
        "get_mew_with_context",
        mewRecord.signed_action.hashed.hash,
        60000
      );
      t.ok(
        MewTypeName.Original in originalMew.mew.mew_type,
        "mew is an original mew"
      );
      t.equal(originalMew.mew.text, aliceMewContent, "mew is alice's mew");
      t.ok(originalMew.quotes.length === 1, "original mew has 1 quote");
      t.deepEqual(
        originalMew.quotes[0],
        quoteRecord.signed_action.hashed.hash,
        "original mew's quote is alice's quote"
      );
    },
    true,
    { timeout: 60000 }
  );
});
