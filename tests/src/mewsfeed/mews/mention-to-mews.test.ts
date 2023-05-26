import { pause, runScenario } from "@holochain/tryorama";
import { assert, expect, test } from "vitest";
import {
  FeedMew,
  LinkTargetName,
  Mew,
  MewTypeName,
} from "../../../../ui/src/types/types.js";
import { mewsfeedAppBundleSource } from "../../common.js";
import { createMew } from "./common.js";
import { ActionHash } from "@holochain/client";

test("mention in mews", async () => {
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

      const actionHash: ActionHash = await createMew(alice.cells[0], {
        text: "this is for @bob",
        links: [{ [LinkTargetName.Mention]: bob.agentPubKey }],
        mew_type: { Original: null },
      });

      await createMew(bob.cells[0], {
        text: "this is for @bob 2",
        links: [{ [LinkTargetName.Mention]: bob.agentPubKey }],
        mew_type: { Original: null },
      });

      const actionHash3 = await createMew(alice.cells[0], {
        text: "this is for @alice",
        links: [{ [LinkTargetName.Mention]: alice.agentPubKey }],
        mew_type: { Original: null },
      });

      assert.deepEqual(
        actionHash.slice(0, 3),
        Buffer.from([132, 41, 36]),
        "alice created a valid mew"
      );

      await pause(1000);

      const mentionedMews: FeedMew[] = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mews_for_mention_with_context",
        payload: {
          mention: bob.agentPubKey,
        },
      });
      assert.ok(mentionedMews.length === 2, "one mew with mention");
      assert.deepEqual(mentionedMews[0].action_hash, actionHash);

      const mentionedMews3: FeedMew[] = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mews_for_mention_with_context",
        payload: {
          mention: alice.agentPubKey,
        },
      });
      assert.ok(mentionedMews3.length === 1, "one mew with mention");
      assert.deepEqual(mentionedMews3[0].action_hash, actionHash3);
    },
    true,
    { timeout: 100000 }
  );
});

test("Mentions list are time-paginated", async () => {
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

      const mewContent1 = "My Mew with @mention 1";
      const createMewInput1: Mew = {
        text: mewContent1,
        links: [{ [LinkTargetName.Mention]: alice.agentPubKey }],
        mew_type: { [MewTypeName.Original]: null },
      };
      const mewActionHash1 = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: createMewInput1,
      });

      const mewContent2 = "My Mew with @mention 2";
      const createMewInput2: Mew = {
        text: mewContent2,
        links: [{ [LinkTargetName.Mention]: alice.agentPubKey }],
        mew_type: { [MewTypeName.Original]: null },
      };
      const mewActionHash2 = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: createMewInput2,
      });

      const mewContent3 = "My Mew with @mention 3";
      const createMewInput3: Mew = {
        text: mewContent3,
        links: [{ [LinkTargetName.Mention]: alice.agentPubKey }],
        mew_type: { [MewTypeName.Original]: null },
      };
      const mewActionHash3 = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: createMewInput3,
      });

      const mewContent4 = "My Mew with @mention 4";
      const createMewInput4: Mew = {
        text: mewContent4,
        links: [{ [LinkTargetName.Mention]: alice.agentPubKey }],
        mew_type: { [MewTypeName.Original]: null },
      };
      const mewActionHash4 = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: createMewInput4,
      });

      const mewContent5 = "My Mew with @mention 5";
      const createMewInput5: Mew = {
        text: mewContent5,
        links: [{ [LinkTargetName.Mention]: alice.agentPubKey }],
        mew_type: { [MewTypeName.Original]: null },
      };
      const mewActionHash5 = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: createMewInput5,
      });

      const mewContent6 = "My Mew with @mention 6";
      const createMewInput6: Mew = {
        text: mewContent6,
        links: [{ [LinkTargetName.Mention]: alice.agentPubKey }],
        mew_type: { [MewTypeName.Original]: null },
      };
      const mewActionHash6 = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: createMewInput6,
      });

      await pause(1000);

      const page1: FeedMew[] = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mews_for_mention_with_context",
        payload: {
          mention: alice.agentPubKey,
          page: {
            start_time: null,
            limit: 2,
          },
        },
      });

      assert.deepEqual(page1[0].action_hash, mewActionHash1);
      assert.deepEqual(page1[1].action_hash, mewActionHash2);
      expect(page1[1].action.timestamp).greaterThanOrEqual(
        page1[0].action.timestamp
      );

      const page2: FeedMew[] = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mews_for_mention_with_context",
        payload: {
          mention: alice.agentPubKey,
          page: {
            after_hash: page1[page1.length - 1].action_hash,
            limit: 2,
          },
        },
      });

      assert.deepEqual(page2[0].action_hash, mewActionHash3);
      assert.deepEqual(page2[1].action_hash, mewActionHash4);
      expect(page2[1].action.timestamp)
        .greaterThanOrEqual(page2[0].action.timestamp)
        .greaterThanOrEqual(page1[1].action.timestamp)
        .greaterThanOrEqual(page1[0].action.timestamp);

      const page3: FeedMew[] = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mews_for_mention_with_context",
        payload: {
          mention: alice.agentPubKey,
          page: {
            after_hash: page2[page2.length - 1].action_hash,
            limit: 2,
          },
        },
      });

      assert.deepEqual(page3[0].action_hash, mewActionHash5);
      assert.deepEqual(page3[1].action_hash, mewActionHash6);
      expect(page3[1].action.timestamp)
        .greaterThanOrEqual(page3[0].action.timestamp)
        .greaterThanOrEqual(page2[1].action.timestamp)
        .greaterThanOrEqual(page2[0].action.timestamp)
        .greaterThanOrEqual(page1[1].action.timestamp)
        .greaterThanOrEqual(page1[0].action.timestamp);

      const page4: FeedMew[] = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mews_for_mention_with_context",
        payload: {
          mention: alice.agentPubKey,
          page: {
            after_hash: page3[page3.length - 1].action_hash,
            limit: 2,
          },
        },
      });

      assert.lengthOf(page4, 0);
    },
    true,
    { timeout: 100000 }
  );
});
