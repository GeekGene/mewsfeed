import { ActionHash } from "@holochain/client";
import { dhtSync, runScenario } from "@holochain/tryorama";
import { assert, expect, test } from "vitest";
import { FeedMew, Mew, MewTypeName } from "../../../../ui/src/types/types";
import { mewsfeedAppBundleSource } from "../../common";
import { createMew } from "./common";

test("create a Mew and get agent mews", async () => {
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

      // Bob gets agent mews
      let collectionOutput: FeedMew[] = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_agent_mews_with_context",
        payload: {
          agent: alice.agentPubKey,
        },
      });
      assert.equal(collectionOutput.length, 0);

      // Alice creates a Mew
      const actionHash: ActionHash = await createMew(alice.cells[0]);
      assert.ok(actionHash);

      await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

      // Bob gets agent mews again
      collectionOutput = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_agent_mews_with_context",
        payload: {
          agent: alice.agentPubKey,
        },
      });
      assert.equal(collectionOutput.length, 1);
      assert.deepEqual(actionHash, collectionOutput[0].action_hash);
    },
    true,
    { timeout: 500000 }
  );
});

test("Agent mews list are time-paginated", async () => {
  await runScenario(
    async (scenario) => {
      // Set up the app to be installed
      const appSource = { appBundleSource: mewsfeedAppBundleSource };

      // Add 2 players with the test app to the Scenario. The returned players
      // can be destructured.
      const [alice] = await scenario.addPlayersWithApps([appSource]);

      const mewContent1 = "My Mew with #hashtag 1";
      const createMewInput1: Mew = {
        text: mewContent1,
        links: [],
        mew_type: MewTypeName.Original,
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
        mew_type: MewTypeName.Original,
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
        mew_type: MewTypeName.Original,
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
        mew_type: MewTypeName.Original,
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
        mew_type: MewTypeName.Original,
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
        mew_type: MewTypeName.Original,
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
        mew_type: MewTypeName.Original,
      };
      const mewActionHash7 = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: createMewInput7,
      });

      const page1: FeedMew[] = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_agent_mews_with_context",
        payload: {
          agent: alice.agentPubKey,
          page: {
            limit: 2,
          },
        },
      });

      assert.deepEqual(page1[0].action_hash, mewActionHash7);
      assert.deepEqual(page1[1].action_hash, mewActionHash6);
      expect(page1[0].action.timestamp).greaterThanOrEqual(
        page1[1].action.timestamp
      );

      const page2: FeedMew[] = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_agent_mews_with_context",
        payload: {
          agent: alice.agentPubKey,
          page: {
            after_hash: page1[page1.length - 1].action_hash,
            limit: 2,
          },
        },
      });

      assert.deepEqual(page2[0].action_hash, mewActionHash5);
      assert.deepEqual(page2[1].action_hash, mewActionHash4);

      expect(page1[0].action.timestamp)
        .greaterThanOrEqual(page1[1].action.timestamp)
        .greaterThanOrEqual(page2[0].action.timestamp)
        .greaterThanOrEqual(page2[1].action.timestamp);

      const page3: FeedMew[] = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_agent_mews_with_context",
        payload: {
          agent: alice.agentPubKey,
          page: {
            after_hash: page2[page2.length - 1].action_hash,
            limit: 2,
          },
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

      const page4: FeedMew[] = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_agent_mews_with_context",
        payload: {
          agent: alice.agentPubKey,
          page: {
            after_hash: page3[page3.length - 1].action_hash,
            limit: 2,
          },
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

      const page5: FeedMew[] = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_agent_mews_with_context",
        payload: {
          agent: alice.agentPubKey,
          page: {
            after_hash: page4[page4.length - 1].action_hash,
            limit: 2,
          },
        },
      });

      assert.lengthOf(page5, 0);
    },
    true,
    { timeout: 500000 }
  );
});
