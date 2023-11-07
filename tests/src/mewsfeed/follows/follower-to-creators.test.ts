import { AgentPubKey, Record } from "@holochain/client";
import { dhtSync, runScenario } from "@holochain/tryorama";
import { assert, expect, it } from "vitest";
import { mewsfeedAppBundleSource } from "../../common";

it("link a Follower to a Creator", async () => {
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
        payload: {
          follower: baseAddress,
        },
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

      await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

      // Bob gets the links again
      linksOutput = await bob.cells[0].callZome({
        zome_name: "follows",
        fn_name: "get_creators_for_follower",
        payload: {
          follower: baseAddress,
        },
      });
      assert.equal(linksOutput.length, 1);

      // Bob gets the links in the inverse direction
      linksOutput = await bob.cells[0].callZome({
        zome_name: "follows",
        fn_name: "get_followers_for_creator",
        payload: {
          creator: targetAddress,
        },
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

      await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

      // Bob gets the links again
      linksOutput = await bob.cells[0].callZome({
        zome_name: "follows",
        fn_name: "get_creators_for_follower",
        payload: {
          follower: baseAddress,
        },
      });
      assert.equal(linksOutput.length, 0);

      // Bob gets the links in the inverse direction
      linksOutput = await bob.cells[0].callZome({
        zome_name: "follows",
        fn_name: "get_followers_for_creator",
        payload: {
          creator: targetAddress,
        },
      });
      assert.equal(linksOutput.length, 0);
    },
    true,
    { timeout: 500000 }
  );
});

it("Agent cannot follow themselves", async () => {
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
      await expect(response).rejects.toThrowError(/InvalidCommit/);
    },
    true,
    { timeout: 500000 }
  );
});

it("Agent can only change their own follows", async () => {
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

      await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

      // Bob tries to remove alices' follow
      const response = bob.cells[0].callZome({
        zome_name: "follows",
        fn_name: "remove_creator_for_follower",
        payload: {
          base_follower: baseAddress,
          target_creator: targetAddress,
        },
      });
      await expect(response).rejects.toThrowError(/InvalidCommit/);

      // Alice removes her own follow
      await alice.cells[0].callZome({
        zome_name: "follows",
        fn_name: "unfollow",
        payload: targetAddress,
      });

      await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

      // Bob tries to add a follow for allice
      const response2 = bob.cells[0].callZome({
        zome_name: "follows",
        fn_name: "add_creator_for_follower",
        payload: {
          base_follower: baseAddress,
          target_creator: targetAddress,
        },
      });
      await expect(response2).rejects.toThrowError(/InvalidCommit/);
    },
    true,
    { timeout: 500000 }
  );
});

it("Creators list are hash-paginated", async () => {
  await runScenario(
    async (scenario) => {
      // Set up the app to be installed
      const appSource = { appBundleSource: mewsfeedAppBundleSource };

      // Add 2 players with the test app to the Scenario. The returned players
      // can be destructured.
      const [alice, bob, carol, john, steve, mary] =
        await scenario.addPlayersWithApps([
          appSource,
          appSource,
          appSource,
          appSource,
          appSource,
          appSource,
        ]);

      // Shortcut peer discovery through gossip and register all agents in every
      // conductor of the scenario.
      await scenario.shareAllAgents();

      // Alice creates a link from Follower to Creator
      await alice.cells[0].callZome({
        zome_name: "follows",
        fn_name: "add_creator_for_follower",
        payload: {
          base_follower: alice.agentPubKey,
          target_creator: bob.agentPubKey,
        },
      });
      await alice.cells[0].callZome({
        zome_name: "follows",
        fn_name: "add_creator_for_follower",
        payload: {
          base_follower: alice.agentPubKey,
          target_creator: carol.agentPubKey,
        },
      });
      await alice.cells[0].callZome({
        zome_name: "follows",
        fn_name: "add_creator_for_follower",
        payload: {
          base_follower: alice.agentPubKey,
          target_creator: john.agentPubKey,
        },
      });
      await alice.cells[0].callZome({
        zome_name: "follows",
        fn_name: "add_creator_for_follower",
        payload: {
          base_follower: alice.agentPubKey,
          target_creator: steve.agentPubKey,
        },
      });
      await alice.cells[0].callZome({
        zome_name: "follows",
        fn_name: "add_creator_for_follower",
        payload: {
          base_follower: alice.agentPubKey,
          target_creator: mary.agentPubKey,
        },
      });

      await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

      const page1: AgentPubKey[] = await alice.cells[0].callZome({
        zome_name: "follows",
        fn_name: "get_creators_for_follower",
        payload: {
          follower: alice.agentPubKey,
          page: {
            limit: 2,
          },
        },
      });

      assert.deepEqual(page1[0], mary.agentPubKey);
      assert.deepEqual(page1[1], steve.agentPubKey);

      const page2: AgentPubKey[] = await alice.cells[0].callZome({
        zome_name: "follows",
        fn_name: "get_creators_for_follower",
        payload: {
          follower: alice.agentPubKey,
          page: {
            after_agentpubkey: page1[1],
            limit: 2,
          },
        },
      });
      assert.deepEqual(page2[0], john.agentPubKey);
      assert.deepEqual(page2[1], carol.agentPubKey);

      const page3: AgentPubKey[] = await alice.cells[0].callZome({
        zome_name: "follows",
        fn_name: "get_creators_for_follower",
        payload: {
          follower: alice.agentPubKey,
          page: {
            after_agentpubkey: page2[1],
            limit: 2,
          },
        },
      });
      assert.lengthOf(page3, 1);
      assert.deepEqual(page3[0], bob.agentPubKey);

      const page5: AgentPubKey[] = await alice.cells[0].callZome({
        zome_name: "follows",
        fn_name: "get_creators_for_follower",
        payload: {
          follower: alice.agentPubKey,
          page: {
            after_agentpubkey: page3[0],
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

it("Followers list are hash-paginated", async () => {
  await runScenario(
    async (scenario) => {
      // Set up the app to be installed
      const appSource = { appBundleSource: mewsfeedAppBundleSource };

      // Add 2 players with the test app to the Scenario. The returned players
      // can be destructured.
      const [alice, bob, carol, john, steve, mary] =
        await scenario.addPlayersWithApps([
          appSource,
          appSource,
          appSource,
          appSource,
          appSource,
          appSource,
        ]);

      // Shortcut peer discovery through gossip and register all agents in every
      // conductor of the scenario.
      await scenario.shareAllAgents();

      // Alice creates a link from Follower to Creator
      await bob.cells[0].callZome({
        zome_name: "follows",
        fn_name: "add_creator_for_follower",
        payload: {
          base_follower: bob.agentPubKey,
          target_creator: alice.agentPubKey,
        },
      });
      await carol.cells[0].callZome({
        zome_name: "follows",
        fn_name: "add_creator_for_follower",
        payload: {
          base_follower: carol.agentPubKey,
          target_creator: alice.agentPubKey,
        },
      });
      await john.cells[0].callZome({
        zome_name: "follows",
        fn_name: "add_creator_for_follower",
        payload: {
          base_follower: john.agentPubKey,
          target_creator: alice.agentPubKey,
        },
      });
      await steve.cells[0].callZome({
        zome_name: "follows",
        fn_name: "add_creator_for_follower",
        payload: {
          base_follower: steve.agentPubKey,
          target_creator: alice.agentPubKey,
        },
      });
      await mary.cells[0].callZome({
        zome_name: "follows",
        fn_name: "add_creator_for_follower",
        payload: {
          base_follower: mary.agentPubKey,
          target_creator: alice.agentPubKey,
        },
      });

      await dhtSync(
        [alice, bob, carol, john, steve, mary],
        alice.cells[0].cell_id[0]
      );

      const page1: AgentPubKey[] = await alice.cells[0].callZome({
        zome_name: "follows",
        fn_name: "get_followers_for_creator",
        payload: {
          creator: alice.agentPubKey,
          page: {
            limit: 2,
          },
        },
      });

      assert.deepEqual(page1[0], mary.agentPubKey);
      assert.deepEqual(page1[1], steve.agentPubKey);

      const page2: AgentPubKey[] = await alice.cells[0].callZome({
        zome_name: "follows",
        fn_name: "get_followers_for_creator",
        payload: {
          creator: alice.agentPubKey,
          page: {
            after_agentpubkey: page1[1],
            limit: 2,
          },
        },
      });
      assert.deepEqual(page2[0], john.agentPubKey);
      assert.deepEqual(page2[1], carol.agentPubKey);

      const page3: AgentPubKey[] = await alice.cells[0].callZome({
        zome_name: "follows",
        fn_name: "get_followers_for_creator",
        payload: {
          creator: alice.agentPubKey,
          page: {
            after_agentpubkey: page2[1],
            limit: 2,
          },
        },
      });
      assert.lengthOf(page3, 1);
      assert.deepEqual(page3[0], bob.agentPubKey);

      const page5: AgentPubKey[] = await alice.cells[0].callZome({
        zome_name: "follows",
        fn_name: "get_followers_for_creator",
        payload: {
          creator: alice.agentPubKey,
          page: {
            after_agentpubkey: page3[0],
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
