import { pause, runScenario } from "@holochain/tryorama";
import { assert, test } from "vitest";
import { FeedMew, LinkTargetName } from "../../../../ui/src/types/types.js";
import { mewsfeedAppBundleSource } from "../../utils.js";
import { createMew } from "./common.js";

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

      const mewRecord = await createMew(alice.cells[0], {
        text: "this is for @bob",
        links: [{ [LinkTargetName.Mention]: bob.agentPubKey }],
        mew_type: { Original: null },
      });

      await createMew(bob.cells[0], {
        text: "this is for @bob 2",
        links: [{ [LinkTargetName.Mention]: bob.agentPubKey }],
        mew_type: { Original: null },
      });

      const mewRecord3 = await createMew(alice.cells[0], {
        text: "this is for @alice",
        links: [{ [LinkTargetName.Mention]: alice.agentPubKey }],
        mew_type: { Original: null },
      });

      assert.deepEqual(
        mewRecord.signed_action.hashed.hash.slice(0, 3),
        Buffer.from([132, 41, 36]),
        "alice created a valid mew"
      );

      await pause(1000);

      const mentionedMews: FeedMew[] = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mews_for_mention_with_context",
        payload: bob.agentPubKey,
      });
      assert.ok(mentionedMews.length === 2, "one mew with mention");
      assert.deepEqual(
        mentionedMews[0].action_hash,
        mewRecord.signed_action.hashed.hash
      );

      const mentionedMews3: FeedMew[] = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mews_for_mention_with_context",
        payload: alice.agentPubKey,
      });
      assert.ok(mentionedMews3.length === 1, "one mew with mention");
      assert.deepEqual(
        mentionedMews3[0].action_hash,
        mewRecord3.signed_action.hashed.hash
      );
    },
    true,
    { timeout: 100000 }
  );
});
