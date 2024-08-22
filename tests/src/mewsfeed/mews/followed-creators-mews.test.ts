import { ActionHash } from "@holochain/client";
import { dhtSync, runScenario } from "@holochain/tryorama";
import { assert, expect, it } from "vitest";
import { FeedMew, Mew, MewTypeName } from "../../../../ui/src/types/types";
import { mewsfeedAppBundleSource } from "../../common";
import { createMew } from "./common";

it("create a Mew and get followed creators mews", async () => {
  await runScenario(
    async (scenario) => {
      // Set up the app to be installed
      const appSource = { appBundleSource: mewsfeedAppBundleSource };

      // Add 2 players with the test app to the Scenario. The returned players
      // can be destructured.
      const [alice, bob] = await scenario.addPlayersWithApps([
        appSource,
        appSource,
      ]);

      // Shortcut peer discovery through gossip and register all agents in every
      // conductor of the scenario.
      await scenario.shareAllAgents();

      // Bob follows alice
      await bob.cells[0].callZome({
        zome_name: "follows",
        fn_name: "follow",
        payload: alice.agentPubKey,
      });

      // Bob gets followed creators mews
      let collectionOutput: FeedMew[] = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_my_followed_creators_mews_with_context",
        payload: null,
      });
      assert.equal(collectionOutput.length, 0);

      // Alice creates a Mew
      const actionHash: ActionHash = await createMew(alice.cells[0]);
      assert.ok(actionHash);

      await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

      // Bob gets followed creators mews again
      collectionOutput = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_my_followed_creators_mews_with_context",
        payload: null,
      });

      assert.equal(collectionOutput.length, 1);
      assert.deepEqual(actionHash, collectionOutput[0].action_hash);
    },
    true,
    { timeout: 500000 }
  );
});

it("Followed creators mews should include mews of followed creator", async () => {
  await runScenario(
    async (scenario) => {
      // Set up the app to be installed
      const appSource = { appBundleSource: mewsfeedAppBundleSource };

      // Add 2 players with the test app to the Scenario. The returned players
      // can be destructured.
      const [alice, bob] = await scenario.addPlayersWithApps([
        appSource,
        appSource,
      ]);

      // Shortcut peer discovery through gossip and register all agents in every
      // conductor of the scenario.
      await scenario.shareAllAgents();

      const mewContent = "test-mew";
      const mewInput: Mew = {
        text: mewContent,
        links: [],
        mew_type: { type: MewTypeName.Original },
      };
      await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: mewInput,
      });

      const bobMewsFeedInitial: FeedMew[] = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_my_followed_creators_mews_with_context",
        payload: null,
      });
      assert.equal(
        bobMewsFeedInitial.length,
        0,
        "bob's mews feed is initially empty"
      );

      await bob.cells[0].callZome({
        zome_name: "follows",
        fn_name: "follow",
        payload: alice.agentPubKey,
      });

      await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

      const bobMewsFeed: FeedMew[] = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_my_followed_creators_mews_with_context",
        payload: null,
      });
      assert.equal(bobMewsFeed.length, 1, "bob's mews feed includes 1 mew");
      assert.equal(
        bobMewsFeed[0].mew.text,
        mewContent,
        "mew content in bob's mews feed matches alice's mew content"
      );
    },
    true,
    { timeout: 500000 }
  );
});

it("Followed creators mews should include own mews", async () => {
  await runScenario(
    async (scenario) => {
      // Set up the app to be installed
      const appSource = { appBundleSource: mewsfeedAppBundleSource };

      // Add 2 players with the test app to the Scenario. The returned players
      // can be destructured.
      const [alice] = await scenario.addPlayersWithApps([appSource]);

      // Shortcut peer discovery through gossip and register all agents in every
      // conductor of the scenario.
      await scenario.shareAllAgents();

      const aliceMewsFeedInitial: FeedMew[] = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_my_followed_creators_mews_with_context",
        payload: null,
      });
      assert.equal(
        aliceMewsFeedInitial.length,
        0,
        "alice's mews feed is initially empty"
      );

      const mewContent = "test-mew";
      const mewInput: Mew = {
        text: mewContent,
        links: [],
        mew_type: { type: MewTypeName.Original },
      };
      await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: mewInput,
      });

      const aliceMewsFeed: FeedMew[] = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_my_followed_creators_mews_with_context",
        payload: null,
      });
      assert.equal(
        aliceMewsFeed.length,
        1,
        "alice's mews feed includes her mew"
      );
      assert.equal(
        aliceMewsFeed[0].mew.text,
        mewContent,
        "mew content matches"
      );
    },
    true,
    { timeout: 500000 }
  );
});

it("Followed creators mews should not include mews of non-followed creator", async () => {
  await runScenario(
    async (scenario) => {
      // Set up the app to be installed
      const appSource = { appBundleSource: mewsfeedAppBundleSource };

      // Add 2 players with the test app to the Scenario. The returned players
      // can be destructured.
      const [alice, bob, carol] = await scenario.addPlayersWithApps([
        appSource,
        appSource,
        appSource,
      ]);

      // Shortcut peer discovery through gossip and register all agents in every
      // conductor of the scenario.
      await scenario.shareAllAgents();

      const aliceMewContent = "alice-test-mew";
      const aliceMewInput: Mew = {
        text: aliceMewContent,
        links: [],
        mew_type: { type: MewTypeName.Original },
      };
      await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: aliceMewInput,
      });

      const carolMewContent = "carol-test-mew";
      const carolMewInput: Mew = {
        text: carolMewContent,
        links: [],
        mew_type: { type: MewTypeName.Original },
      };
      await carol.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: carolMewInput,
      });

      await bob.cells[0].callZome({
        zome_name: "follows",
        fn_name: "follow",
        payload: alice.agentPubKey,
      });
      await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

      const bobMewsFeed: FeedMew[] = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_my_followed_creators_mews_with_context",
        payload: null,
      });
      assert.equal(bobMewsFeed.length, 1, "bob's mews feed includes 1 mew");
      assert.equal(
        bobMewsFeed[0].mew.text,
        aliceMewContent,
        "mew content in bob's mews feed matches alice's mew content"
      );
    },
    true,
    { timeout: 500000 }
  );
});

it("Unfollowing should exclude creators mews from feed", async () => {
  await runScenario(
    async (scenario) => {
      // Set up the app to be installed
      const appSource = { appBundleSource: mewsfeedAppBundleSource };

      // Add 2 players with the test app to the Scenario. The returned players
      // can be destructured.
      const [alice, bob] = await scenario.addPlayersWithApps([
        appSource,
        appSource,
      ]);

      // Shortcut peer discovery through gossip and register all agents in every
      // conductor of the scenario.
      await scenario.shareAllAgents();

      const aliceMewContent = "alice-test-mew";
      const aliceMewInput: Mew = {
        text: aliceMewContent,
        links: [],
        mew_type: { [MewTypeName.Original]: null },
      };
      await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: aliceMewInput,
      });

      await bob.cells[0].callZome({
        zome_name: "follows",
        fn_name: "follow",
        payload: alice.agentPubKey,
      });
      await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

      const bobMewsFeedWhenFollowing: FeedMew[] = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_my_followed_creators_mews_with_context",
        payload: null,
      });
      assert.equal(
        bobMewsFeedWhenFollowing.length,
        1,
        "bob's mews feed includes 1 mew"
      );
      assert.equal(
        bobMewsFeedWhenFollowing[0].mew.text,
        aliceMewContent,
        "mew content in bob's mews feed matches alice's mew content"
      );

      await bob.cells[0].callZome({
        zome_name: "follows",
        fn_name: "unfollow",
        payload: alice.agentPubKey,
      });

      const bobMewsFeed: FeedMew[] = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_my_followed_creators_mews_with_context",
        payload: null,
      });
      assert.equal(bobMewsFeed.length, 0, "bob's mews feed is empty");
    },
    true,
    { timeout: 500000 }
  );
});

it("Followed creators mews should be ordered by timestamp in descending order", async () => {
  await runScenario(
    async (scenario) => {
      // Set up the app to be installed
      const appSource = { appBundleSource: mewsfeedAppBundleSource };

      // Add 2 players with the test app to the Scenario. The returned players
      // can be destructured.
      const [alice, bob, carol] = await scenario.addPlayersWithApps([
        appSource,
        appSource,
        appSource,
      ]);

      // Shortcut peer discovery through gossip and register all agents in every
      // conductor of the scenario.
      await scenario.shareAllAgents();

      const firstMewContent = "first-test-mew";
      const firstMewInput: Mew = {
        text: firstMewContent,
        links: [],
        mew_type: { [MewTypeName.Original]: null },
      };
      await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: firstMewInput,
      });

      const secondMewContent = "second-test-mew";
      const secondMewInput: Mew = {
        text: secondMewContent,
        links: [],
        mew_type: { [MewTypeName.Original]: null },
      };
      await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: secondMewInput,
      });

      const thirdMewContent = "third-test-mew";
      const thirdMewInput: Mew = {
        text: thirdMewContent,
        links: [],
        mew_type: { [MewTypeName.Original]: null },
      };
      await carol.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: thirdMewInput,
      });

      const fourthMewContent = "fourth-test-mew";
      const fourthMewInput: Mew = {
        text: fourthMewContent,
        links: [],
        mew_type: { [MewTypeName.Original]: null },
      };
      await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: fourthMewInput,
      });
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

      await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

      const aliceMewsFeed: FeedMew[] = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_my_followed_creators_mews_with_context",
        payload: null,
      });
      assert.equal(
        aliceMewsFeed.length,
        4,
        "alice's mews feed includes all 4 mews"
      );
      assert.equal(
        aliceMewsFeed[0].mew.text,
        fourthMewContent,
        "mew 1 in feed is fourth mew"
      );
      assert.equal(
        aliceMewsFeed[1].mew.text,
        thirdMewContent,
        "mew 2 in feed is third mew"
      );
      assert.equal(
        aliceMewsFeed[2].mew.text,
        secondMewContent,
        "mew 3 in feed is second mew"
      );
      assert.equal(
        aliceMewsFeed[3].mew.text,
        firstMewContent,
        "mew 4 in feed is first mew"
      );
    },
    true,
    { timeout: 500000 }
  );
});

it("Followed creators mews list are time-paginated", async () => {
  await runScenario(
    async (scenario) => {
      // Set up the app to be installed
      const appSource = { appBundleSource: mewsfeedAppBundleSource };

      // Add 2 players with the test app to the Scenario. The returned players
      // can be destructured.
      const [alice, bob] = await scenario.addPlayersWithApps([
        appSource,
        appSource,
      ]);

      // Shortcut peer discovery through gossip and register all agents in every
      // conductor of the scenario.
      await scenario.shareAllAgents();

      const mewContent1 = "My Mew with #hashtag 1";
      const createMewInput1: Mew = {
        text: mewContent1,
        links: [],
        mew_type: { [MewTypeName.Original]: null },
      };
      const mewActionHash1 = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: createMewInput1,
      });

      const mewContent2 = "My Mew with #hashtag 2";
      const createMewInput2: Mew = {
        text: mewContent2,
        links: [],
        mew_type: { [MewTypeName.Original]: null },
      };
      const mewActionHash2 = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: createMewInput2,
      });

      const mewContent3 = "My Mew with #hashtag 3";
      const createMewInput3: Mew = {
        text: mewContent3,
        links: [],
        mew_type: { [MewTypeName.Original]: null },
      };
      const mewActionHash3 = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: createMewInput3,
      });

      const mewContent4 = "My Mew with #hashtag 4";
      const createMewInput4: Mew = {
        text: mewContent4,
        links: [],
        mew_type: { [MewTypeName.Original]: null },
      };
      const mewActionHash4 = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: createMewInput4,
      });

      const mewContent5 = "My Mew with #hashtag 5";
      const createMewInput5: Mew = {
        text: mewContent5,
        links: [],
        mew_type: { [MewTypeName.Original]: null },
      };
      const mewActionHash5 = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: createMewInput5,
      });

      const mewContent6 = "My Mew with #hashtag 6";
      const createMewInput6: Mew = {
        text: mewContent6,
        links: [],
        mew_type: { [MewTypeName.Original]: null },
      };
      const mewActionHash6 = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: createMewInput6,
      });

      const mewContent7 = "My Mew with #hashtag 7";
      const createMewInput7: Mew = {
        text: mewContent7,
        links: [],
        mew_type: { [MewTypeName.Original]: null },
      };
      const mewActionHash7 = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: createMewInput7,
      });

      await bob.cells[0].callZome({
        zome_name: "follows",
        fn_name: "follow",
        payload: alice.agentPubKey,
      });

      await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

      const page1: FeedMew[] = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_my_followed_creators_mews_with_context",
        payload: {
          limit: 2,
        },
      });

      assert.deepEqual(page1[0].action_hash, mewActionHash7);
      assert.deepEqual(page1[1].action_hash, mewActionHash6);
      expect(page1[0].action.timestamp).greaterThanOrEqual(
        page1[1].action.timestamp
      );

      const page2: FeedMew[] = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_my_followed_creators_mews_with_context",
        payload: {
          after_hash: page1[page1.length - 1].action_hash,
          limit: 2,
        },
      });

      assert.deepEqual(page2[0].action_hash, mewActionHash5);
      assert.deepEqual(page2[1].action_hash, mewActionHash4);
      expect(page1[0].action.timestamp)
        .greaterThanOrEqual(page1[1].action.timestamp)
        .greaterThanOrEqual(page2[0].action.timestamp)
        .greaterThanOrEqual(page2[1].action.timestamp);

      const page3: FeedMew[] = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_my_followed_creators_mews_with_context",
        payload: {
          after_hash: page2[page2.length - 1].action_hash,
          limit: 2,
        },
      });

      assert.deepEqual(page3[0].action_hash, mewActionHash3);
      assert.deepEqual(page3[1].action_hash, mewActionHash2);
      expect(page1[0].action.timestamp)
        .greaterThanOrEqual(page1[1].action.timestamp)
        .greaterThanOrEqual(page2[0].action.timestamp)
        .greaterThanOrEqual(page2[1].action.timestamp)
        .greaterThanOrEqual(page3[0].action.timestamp)
        .greaterThanOrEqual(page3[1].action.timestamp);

      const page4: FeedMew[] = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_my_followed_creators_mews_with_context",
        payload: {
          after_hash: page3[page3.length - 1].action_hash,
          limit: 2,
        },
      });

      assert.lengthOf(page4, 1);
      assert.deepEqual(page4[0].action_hash, mewActionHash1);
      expect(page1[0].action.timestamp)
        .greaterThanOrEqual(page1[1].action.timestamp)
        .greaterThanOrEqual(page2[0].action.timestamp)
        .greaterThanOrEqual(page2[1].action.timestamp)
        .greaterThanOrEqual(page3[0].action.timestamp)
        .greaterThanOrEqual(page3[1].action.timestamp)
        .greaterThanOrEqual(page4[0].action.timestamp);

      const page5: FeedMew[] = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_my_followed_creators_mews_with_context",
        payload: {
          after_hash: page4[page4.length - 1].action_hash,
          limit: 2,
        },
      });

      assert.lengthOf(page5, 0);
    },
    true,
    { timeout: 500000 }
  );
});
