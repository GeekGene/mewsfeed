import { ActionHash } from "@holochain/client";
import { dhtSync, runScenario } from "@holochain/tryorama";
import { assert, expect, it } from "vitest";
import { FeedMew, MewTypeName } from "../../../../ui/src/types/types";
import { mewsfeedAppBundleSource } from "../../common";
import { createMew } from "./common";

it("Mew with context contains licks count and is_licked", async () => {
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

      // Alice creates a Mew
      const actionHash: ActionHash = await createMew(alice.cells[0]);
      assert.ok(actionHash);

      await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

      // Bob licks the mew
      await bob.cells[0].callZome({
        zome_name: "likes",
        fn_name: "like",
        payload: actionHash,
      });

      await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

      // Bob gets the mew with context
      let feedMew: FeedMew = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mew_with_context",
        payload: actionHash,
      });
      expect(feedMew.licks_count).toEqual(1);
      expect(feedMew.is_licked).true;

      // Alice gets the mew with context
      let aliceFeedMew: FeedMew = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mew_with_context",
        payload: actionHash,
      });
      expect(aliceFeedMew.licks_count).toEqual(1);
      expect(aliceFeedMew.is_licked).false;

      // Bob unlicks the mew
      await bob.cells[0].callZome({
        zome_name: "likes",
        fn_name: "unlike",
        payload: actionHash,
      });

      await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

      // Bob gets the mew with context
      feedMew = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mew_with_context",
        payload: actionHash,
      });
      expect(feedMew.licks_count).toEqual(0);
      expect(feedMew.is_licked).false;

      // Alice gets the mew with context
      aliceFeedMew = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mew_with_context",
        payload: actionHash,
      });
      expect(aliceFeedMew.licks_count).toEqual(0);
      expect(aliceFeedMew.is_licked).false;
    },
    true,
    { timeout: 500000 }
  );
});

it("Mew with context contains replies count and is_replied", async () => {
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

      // Alice creates a Mew
      const actionHash: ActionHash = await createMew(alice.cells[0]);
      assert.ok(actionHash);

      await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

      // Bob replies the mew
      await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: {
          text: "my reply blah blah",
          links: [],
          mew_type: { type: MewTypeName.Reply, original_action_hash: actionHash },
        },
      });

      await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

      // Bob gets the mew with context
      const feedMew: FeedMew = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mew_with_context",
        payload: actionHash,
      });
      expect(feedMew.replies_count).toEqual(1);
      expect(feedMew.is_replied).true;

      // Alice gets the mew with context
      const aliceFeedMew: FeedMew = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mew_with_context",
        payload: actionHash,
      });
      expect(aliceFeedMew.replies_count).toEqual(1);
      expect(aliceFeedMew.is_replied).false;
    },
    true,
    { timeout: 500000 }
  );
});

it("Mew with context contains quotes count and is_quoted", async () => {
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

      // Alice creates a Mew
      const actionHash: ActionHash = await createMew(alice.cells[0]);
      assert.ok(actionHash);

      await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

      // Bob replies the mew
      await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: {
          text: "this is a quote blah blah",
          links: [],
          mew_type: { type: MewTypeName.Quote, original_action_hash: actionHash },
        },
      });

      await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

      // Bob gets the mew with context
      const feedMew: FeedMew = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mew_with_context",
        payload: actionHash,
      });
      expect(feedMew.quotes_count).toEqual(1);
      expect(feedMew.is_quoted).true;

      // Alice gets the mew with context
      const aliceFeedMew: FeedMew = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mew_with_context",
        payload: actionHash,
      });
      expect(aliceFeedMew.quotes_count).toEqual(1);
      expect(aliceFeedMew.is_quoted).false;
    },
    true,
    { timeout: 500000 }
  );
});

it("Mew with context contains mewmews count and is_mewmewed", async () => {
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

      // Alice creates a Mew
      const actionHash: ActionHash = await createMew(alice.cells[0]);
      assert.ok(actionHash);

      await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

      // Bob mewmews the mew
      await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: {
          text: "",
          links: [],
          mew_type: { type: MewTypeName.Mewmew, original_action_hash: actionHash },
        },
      });

      await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

      // Bob gets the mew with context
      const feedMew: FeedMew = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mew_with_context",
        payload: actionHash,
      });
      expect(feedMew.mewmews_count).toEqual(1);
      expect(feedMew.is_mewmewed).true;
      console.warn("bob got mew");

      // Alice gets the mew with context
      const aliceFeedMew: FeedMew = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mew_with_context",
        payload: actionHash,
      });
      console.warn("alice got mew");

      expect(aliceFeedMew.mewmews_count).toEqual(1);
      expect(aliceFeedMew.is_mewmewed).false;
    },
    true,
    { timeout: 500000 }
  );
});

it("Mew with context contains is_pinned", async () => {
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

      // Alice creates a Mew
      const actionHash: ActionHash = await createMew(alice.cells[0]);
      assert.ok(actionHash);

      await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

      // Bob pins the mew
      await bob.cells[0].callZome({
        zome_name: "agent_pins",
        fn_name: "pin_hash",
        payload: actionHash,
      });

      await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

      // Bob gets the mew with context
      let feedMew: FeedMew = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mew_with_context",
        payload: actionHash,
      });
      expect(feedMew.is_pinned).true;

      // Alice gets the mew with context
      let aliceFeedMew: FeedMew = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mew_with_context",
        payload: actionHash,
      });
      expect(aliceFeedMew.is_pinned).false;

      // Bob unpins the mew
      await bob.cells[0].callZome({
        zome_name: "agent_pins",
        fn_name: "unpin_hash",
        payload: actionHash,
      });

      await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

      // Bob gets the mew with context
      feedMew = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mew_with_context",
        payload: actionHash,
      });
      expect(feedMew.is_pinned).false;

      // Alice gets the mew with context
      aliceFeedMew = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mew_with_context",
        payload: actionHash,
      });
      expect(aliceFeedMew.is_pinned).false;
    },
    true,
    { timeout: 500000 }
  );
});
