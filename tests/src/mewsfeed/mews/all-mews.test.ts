import { assert, test } from "vitest";
import { runScenario, pause } from "@holochain/tryorama";
import { Record } from "@holochain/client";
import { createMew } from "./common";
import { mewsfeedAppBundleSource } from "../../common";

test("create a Mew and get all mews", async () => {
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
      const actionHash: ActionHash = await createMew(alice.cells[0]);
      assert.ok(actionHash);

      await pause(1200);

      // Bob gets all mews again
      collectionOutput = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_all_mews",
        payload: null,
      });
      assert.equal(collectionOutput.length, 1);
      assert.deepEqual(
        actionHash,
        collectionOutput[0].signed_action.hashed.hash
      );
    },
    true,
    { timeout: 100000 }
  );
});
