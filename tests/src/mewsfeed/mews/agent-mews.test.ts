import { assert, test } from "vitest";
import { runScenario, pause } from "@holochain/tryorama";
import { Record } from "@holochain/client";
import { decode } from "@msgpack/msgpack";
import { createMew } from "./common";
import { FeedMew, Mew } from "../../../../ui/src/types/types";
import { mewsfeedAppBundleSource } from "../../common";

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

      // Shortcut peer discovery through gossip and register all agents in every
      // conductor of the scenario.
      await scenario.shareAllAgents();

      // Bob gets agent mews
      let collectionOutput: FeedMew[] = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_agent_mews_with_context",
        payload: alice.agentPubKey,
      });
      assert.equal(collectionOutput.length, 0);

      // Alice creates a Mew
      const createdRecord: Record = await createMew(alice.cells[0]);
      assert.ok(createdRecord);

      await pause(1200);

      // Bob gets agent mews again
      collectionOutput = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_agent_mews_with_context",
        payload: alice.agentPubKey,
      });
      assert.equal(collectionOutput.length, 1);
      assert.deepEqual(
        decode((createdRecord.entry as any).Present.entry) as Mew,
        collectionOutput[0].mew
      );
    },
    true,
    { timeout: 100000 }
  );
});
