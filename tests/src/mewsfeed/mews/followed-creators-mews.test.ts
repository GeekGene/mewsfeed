import { assert, test } from "vitest";
import { runScenario, pause } from "@holochain/tryorama";
import { Record } from "@holochain/client";
import { createMew } from "./common";
import { FeedMew, Mew, MewTypeName } from "../../../../ui/src/types/types";
import { mewsfeedAppBundleSource } from "../../utils";

test("create a Mew and get followed creators mews", async () => {
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

      // Bob gets all mews
      let collectionOutput: Record[] = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_all_mews",
        payload: null,
      });
      assert.equal(collectionOutput.length, 0);

      // Alice creates a Mew
      const createdRecord: Record = await createMew(alice.cells[0]);
      assert.ok(createdRecord);

      await pause(1200);

      // Bob gets all mews again
      collectionOutput = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_all_mews",
        payload: null,
      });
      assert.equal(collectionOutput.length, 1);
      assert.deepEqual(createdRecord, collectionOutput[0]);
    },
    true,
    { timeout: 100000 }
  );
});

test("Followed creators mews should include mews of followed agent", async () => {
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
        mew_type: { [MewTypeName.Original]: null },
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
      assert.ok(
        bobMewsFeedInitial.length === 0,
        "bob's mews feed is initially empty"
      );

      await bob.cells[0].callZome({
        zome_name: "follows",
        fn_name: "follow",
        payload: alice.agentPubKey,
      });

      const bobMewsFeed: FeedMew[] = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_my_followed_creators_mews_with_context",
        payload: null,
      });
      assert.ok(bobMewsFeed.length === 1, "bob's mews feed includes 1 mew");
      assert.equal(
        bobMewsFeed[0].mew.text,
        mewContent,
        "mew content in bob's mews feed matches alice's mew content"
      );
    },
    true,
    { timeout: 100000 }
  );
});

test("Followed creators mews should include own mews", async () => {
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
      assert.ok(
        aliceMewsFeedInitial.length === 0,
        "alice's mews feed is initially empty"
      );

      const mewContent = "test-mew";
      const mewInput: Mew = {
        text: mewContent,
        links: [],
        mew_type: { [MewTypeName.Original]: null },
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
      assert.ok(
        aliceMewsFeed.length === 1,
        "alice's mews feed includes her mew"
      );
      assert.equal(
        aliceMewsFeed[0].mew.text,
        mewContent,
        "mew content matches"
      );
    },
    true,
    { timeout: 100000 }
  );
});

test("Followed creators mews should not include mews of non-followed creator", async () => {
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
        mew_type: { [MewTypeName.Original]: null },
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
        mew_type: { [MewTypeName.Original]: null },
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
      await pause(1000);

      const bobMewsFeed: FeedMew[] = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_my_followed_creators_mews_with_context",
        payload: null,
      });
      assert.ok(bobMewsFeed.length === 1, "bob's mews feed includes 1 mew");
      assert.equal(
        bobMewsFeed[0].mew.text,
        aliceMewContent,
        "mew content in bob's mews feed matches alice's mew content"
      );
    },
    true,
    { timeout: 100000 }
  );
});

test("Unfollowing should exclude creators mews from feed", async () => {
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
      await pause(1000);

      const bobMewsFeedWhenFollowing: FeedMew[] = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_my_followed_creators_mews_with_context",
        payload: null,
      });
      assert.ok(
        bobMewsFeedWhenFollowing.length === 1,
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
      assert.ok(bobMewsFeed.length === 0, "bob's mews feed is empty");
    },
    true,
    { timeout: 100000 }
  );
});

test("Followed creators mews should be ordered by timestamp in descending order", async () => {
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

      await pause(1000);

      const aliceMewsFeed: FeedMew[] = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_my_followed_creators_mews_with_context",
        payload: null,
      });
      assert.ok(
        aliceMewsFeed.length === 4,
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
    { timeout: 100000 }
  );
});
