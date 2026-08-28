import { ActionHash } from "@holochain/client";
import { dhtSync, runScenario } from "@holochain-open-dev/tryorama";
import { assert, test } from "vitest";
import { mewsfeedAppBundleSource, wrapInput } from "../../common";
import { createMew } from "./common";

// The Explore page reads the index this covers: get_random_mew_hashes ->
// get_all_mew_hashes -> get_links on the shared "all_mews" path. Nothing else
// in the suite exercises it, and it is the one feed that must show mews by
// agents you do not follow.
test("all_mews is visible to another agent", async () => {
  await runScenario(
    async (scenario) => {
      const appSource = { appBundleSource: mewsfeedAppBundleSource };
      const [alice, bob] = await scenario.addPlayersWithApps([
        appSource,
        appSource,
      ]);

      const aliceMew: ActionHash = await createMew(alice.cells[0]);
      const bobMew: ActionHash = await createMew(bob.cells[0]);

      await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

      // A local read is what the UI does by default, and is the case that
      // depends on the other agent's links having gossiped and integrated.
      const bobSeesLocally: ActionHash[] = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_random_mew_hashes",
        payload: wrapInput(10),
      });
      assert.equal(
        bobSeesLocally.length,
        2,
        "bob should see both mews in all_mews after sync"
      );

      const aliceSeesLocally: ActionHash[] = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_random_mew_hashes",
        payload: wrapInput(10),
      });
      assert.equal(
        aliceSeesLocally.length,
        2,
        "alice should see both mews in all_mews after sync"
      );

      // The same read against the network, which is what the UI falls back to
      // when a user turns off local-only mode.
      const bobSeesOnNetwork: ActionHash[] = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_random_mew_hashes",
        payload: wrapInput(10, false),
      });
      assert.equal(bobSeesOnNetwork.length, 2);

      assert.ok(aliceMew);
      assert.ok(bobMew);
    },
    true,
    { timeout: 500000 }
  );
});
