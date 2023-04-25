import { assert, test } from "vitest";
import { runScenario, pause } from "@holochain/tryorama";
import { Record } from "@holochain/client";
import { createMew } from "./common";
import { mewsfeedAppBundleSource } from "../../utils";

test("link a Liker to a Mew", async () => {
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

      const baseAddress = alice.agentPubKey;
      const targetRecord = await createMew(alice.cells[0]);
      const targetAddress = targetRecord.signed_action.hashed.hash;

      // Bob gets the links, should be empty
      let linksOutput: Record[] = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mews_for_liker",
        payload: baseAddress,
      });
      assert.equal(linksOutput.length, 0);

      // Alice creates a link from Liker to Mew
      await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "add_mew_for_liker",
        payload: {
          base_liker: baseAddress,
          target_mew_hash: targetAddress,
        },
      });

      await pause(1200);

      // Bob gets the links again
      linksOutput = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mews_for_liker",
        payload: baseAddress,
      });
      assert.equal(linksOutput.length, 1);
      assert.deepEqual(targetRecord, linksOutput[0]);

      // Bob gets the links in the inverse direction
      linksOutput = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_likers_for_mew",
        payload: targetAddress,
      });
      assert.equal(linksOutput.length, 1);

      await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "remove_mew_for_liker",
        payload: {
          base_liker: baseAddress,
          target_mew_hash: targetAddress,
        },
      });

      await pause(1200);

      // Bob gets the links again
      linksOutput = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mews_for_liker",
        payload: baseAddress,
      });
      assert.equal(linksOutput.length, 0);

      // Bob gets the links in the inverse direction
      linksOutput = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_likers_for_mew",
        payload: targetAddress,
      });
      assert.equal(linksOutput.length, 0);
    },
    true,
    { timeout: 100000 }
  );
});
