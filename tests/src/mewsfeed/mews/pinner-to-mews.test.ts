import { assert, test } from "vitest";
import { runScenario, pause } from "@holochain/tryorama";
import { ActionHash, Record } from "@holochain/client";
import { createMew } from "./common.js";

test("link a Pinner to a Mew", async () => {
  await runScenario(
    async (scenario) => {
      // Construct proper paths for your app.
      // This assumes app bundle created by the `hc app pack` command.
      const testAppPath = process.cwd() + "/../workdir/mewsfeed.happ";

      // Set up the app to be installed
      const appSource = { appBundleSource: { path: testAppPath } };

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
      const targetActionHash: ActionHash = await createMew(alice.cells[0]);

      // Bob gets the links, should be empty
      let linksOutput: Record[] = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mews_for_pinner",
        payload: baseAddress,
      });
      assert.equal(linksOutput.length, 0);

      // Alice creates a link from Pinner to Mew
      await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "add_mew_for_pinner",
        payload: {
          base_pinner: baseAddress,
          target_mew_hash: targetActionHash,
        },
      });

      await pause(1200);

      // Bob gets the links again
      linksOutput = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mews_for_pinner",
        payload: baseAddress,
      });
      assert.equal(linksOutput.length, 1);
      assert.deepEqual(
        targetActionHash,
        linksOutput[0].signed_action.hashed.hash
      );

      await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "remove_mew_for_pinner",
        payload: {
          base_pinner: baseAddress,
          target_mew_hash: targetActionHash,
        },
      });

      await pause(1200);

      // Bob gets the links again
      linksOutput = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mews_for_pinner",
        payload: baseAddress,
      });
      assert.equal(linksOutput.length, 0);
    },
    true,
    { timeout: 100000 }
  );
});
