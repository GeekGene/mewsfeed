import { assert, test, expect } from "vitest";
import { runScenario, pause } from "@holochain/tryorama";
import { Record } from "@holochain/client";
import { mewsfeedAppBundleSource } from "../../common";

test("link a Follower to a Creator", async () => {
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
      const targetAddress = bob.agentPubKey;

      // Bob gets the links, should be empty
      let linksOutput: Record[] = await bob.cells[0].callZome({
        zome_name: "follows",
        fn_name: "get_creators_for_follower",
        payload: baseAddress,
      });
      assert.equal(linksOutput.length, 0);

      // Alice creates a link from Follower to Creator
      await alice.cells[0].callZome({
        zome_name: "follows",
        fn_name: "add_creator_for_follower",
        payload: {
          base_follower: baseAddress,
          target_creator: targetAddress,
        },
      });

      await pause(1200);

      // Bob gets the links again
      linksOutput = await bob.cells[0].callZome({
        zome_name: "follows",
        fn_name: "get_creators_for_follower",
        payload: baseAddress,
      });
      assert.equal(linksOutput.length, 1);

      // Bob gets the links in the inverse direction
      linksOutput = await bob.cells[0].callZome({
        zome_name: "follows",
        fn_name: "get_followers_for_creator",
        payload: targetAddress,
      });
      assert.equal(linksOutput.length, 1);

      await alice.cells[0].callZome({
        zome_name: "follows",
        fn_name: "remove_creator_for_follower",
        payload: {
          base_follower: baseAddress,
          target_creator: targetAddress,
        },
      });

      await pause(1200);

      // Bob gets the links again
      linksOutput = await bob.cells[0].callZome({
        zome_name: "follows",
        fn_name: "get_creators_for_follower",
        payload: baseAddress,
      });
      assert.equal(linksOutput.length, 0);

      // Bob gets the links in the inverse direction
      linksOutput = await bob.cells[0].callZome({
        zome_name: "follows",
        fn_name: "get_followers_for_creator",
        payload: targetAddress,
      });
      assert.equal(linksOutput.length, 0);
    },
    true,
    { timeout: 100000 }
  );
});

test("Agent cannot follow themselves", async () => {
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

      // Alice tries to follow herself
      const response = alice.cells[0].callZome({
        zome_name: "follows",
        fn_name: "follow",
        payload: alice.agentPubKey,
      });
      await expect(response).rejects.toHaveProperty(
        "data.data",
        expect.stringContaining("InvalidCommit")
      );
    },
    true,
    { timeout: 100000 }
  );
});

test("Agent can only change their own follows", async () => {
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
      const targetAddress = bob.agentPubKey;

      // Alice follows bob
      await alice.cells[0].callZome({
        zome_name: "follows",
        fn_name: "follow",
        payload: targetAddress,
      });

      await pause(1200);

      // Bob tries to remove alices' follow
      const response = bob.cells[0].callZome({
        zome_name: "follows",
        fn_name: "remove_creator_for_follower",
        payload: {
          base_follower: baseAddress,
          target_creator: targetAddress,
        },
      });
      await expect(response).rejects.toHaveProperty(
        "data.data",
        expect.stringContaining("InvalidCommit")
      );

      // Alice removes her own follow
      await alice.cells[0].callZome({
        zome_name: "follows",
        fn_name: "unfollow",
        payload: targetAddress,
      });

      await pause(1200);

      // Bob tries to add a follow for allice
      const response2 = bob.cells[0].callZome({
        zome_name: "follows",
        fn_name: "add_creator_for_follower",
        payload: {
          base_follower: baseAddress,
          target_creator: targetAddress,
        },
      });
      await expect(response2).rejects.toHaveProperty(
        "data.data",
        expect.stringContaining("InvalidCommit")
      );
    },
    true,
    { timeout: 100000 }
  );
});
