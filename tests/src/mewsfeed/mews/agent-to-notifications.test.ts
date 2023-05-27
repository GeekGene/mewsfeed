import { assert, expect, test } from "vitest";
import { runScenario, pause } from "@holochain/tryorama";
import { ActionHash } from "@holochain/client";
import { createMew } from "./common";
import {
  FeedMew,
  Mew,
  MewTypeName,
  NotificationTypeName,
} from "../../../../ui/src/types/types";
import { mewsfeedAppBundleSource } from "../../common";

test("notifications include my agent follows & unfollows", async () => {
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

      // Bob follows Alice
      await bob.cells[0].callZome({
        zome_name: "follows",
        fn_name: "add_creator_for_follower",
        payload: {
          base_follower: bob.agentPubKey,
          target_creator: alice.agentPubKey,
        },
      });

      // Bob unfollows Alice
      await bob.cells[0].callZome({
        zome_name: "follows",
        fn_name: "remove_creator_for_follower",
        payload: {
          base_follower: bob.agentPubKey,
          target_creator: alice.agentPubKey,
        },
      });

      await pause(1200);

      // Alice gets notifications
      const notifications = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_my_notifications",
        payload: null,
      });

      // Notifications should be orderded by action time descending (newest first)
      expect(notifications[0]).toMatchObject({
        agent: bob.agentPubKey,
        notification_type: { [NotificationTypeName.MyAgentUnfollowed]: null },
      });
      expect(notifications[1]).toMatchObject({
        agent: bob.agentPubKey,
        notification_type: { [NotificationTypeName.MyAgentFollowed]: null },
      });
    },
    true,
    { timeout: 150000 }
  );
});

test("notifications include my mews' likes & unlikes", async () => {
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

      // Alice creates a Mew
      const actionHash: ActionHash = await createMew(alice.cells[0]);
      assert.ok(actionHash);
      const feedMew: FeedMew = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mew_with_context",
        payload: actionHash,
      });

      await pause(1200);

      // Bob likes Alice's Mew
      await bob.cells[0].callZome({
        zome_name: "likes",
        fn_name: "add_hash_for_liker",
        payload: {
          base_liker: bob.agentPubKey,
          target_hash: actionHash,
        },
      });

      // Bob unlikes Alice's Mew
      await bob.cells[0].callZome({
        zome_name: "likes",
        fn_name: "remove_hash_for_liker",
        payload: {
          base_liker: bob.agentPubKey,
          target_hash: actionHash,
        },
      });

      await pause(1200);

      // Alice gets notifications
      const notifications = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_my_notifications",
        payload: null,
      });

      expect(notifications[0]).toMatchObject({
        agent: bob.agentPubKey,
        notification_type: { [NotificationTypeName.MyMewUnlicked]: null },
        feed_mew: feedMew,
      });
      expect(notifications[1]).toMatchObject({
        agent: bob.agentPubKey,
        notification_type: { [NotificationTypeName.MyMewLicked]: null },
        feed_mew: feedMew,
      });
    },
    true,
    { timeout: 150000 }
  );
});

test("notifications include my mews' pins & unpins", async () => {
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

      // Alice creates a Mew
      const actionHash: ActionHash = await createMew(alice.cells[0]);
      assert.ok(actionHash);
      const feedMew: FeedMew = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mew_with_context",
        payload: actionHash,
      });

      await pause(1200);

      // Bob likes Alice's Mew
      await bob.cells[0].callZome({
        zome_name: "agent_pins",
        fn_name: "add_hash_for_pinner",
        payload: {
          base_pinner: bob.agentPubKey,
          target_hash: actionHash,
        },
      });

      // Bob unlikes Alice's Mew
      await bob.cells[0].callZome({
        zome_name: "agent_pins",
        fn_name: "remove_hash_for_pinner",
        payload: {
          base_pinner: bob.agentPubKey,
          target_hash: actionHash,
        },
      });

      await pause(1200);

      // Alice gets notifications
      const notifications = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_my_notifications",
        payload: null,
      });

      expect(notifications[0]).toMatchObject({
        agent: bob.agentPubKey,
        notification_type: { [NotificationTypeName.MyMewUnpinned]: null },
        feed_mew: feedMew,
      });
      expect(notifications[1]).toMatchObject({
        agent: bob.agentPubKey,
        notification_type: { [NotificationTypeName.MyMewPinned]: null },
        feed_mew: feedMew,
      });
    },
    true,
    { timeout: 150000 }
  );
});

test("notifications include my mews' replies, quotes, mewmews", async () => {
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

      // Alice creates a Mew
      const actionHash: ActionHash = await createMew(alice.cells[0]);
      assert.ok(actionHash);

      await pause(1200);

      // Bob replies to Alice's mew
      const replyInput: Mew = {
        text: "test reply 12345",
        links: [],
        mew_type: { [MewTypeName.Reply]: actionHash },
      };
      const replyActionHash: ActionHash = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: replyInput,
      });
      const replyFeedMew: FeedMew = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mew_with_context",
        payload: replyActionHash,
      });

      // Bob mewmews Alice's mew
      const mewmewInput: Mew = {
        text: "",
        links: [],
        mew_type: { [MewTypeName.Mewmew]: actionHash },
      };
      const mewmewActionHash: ActionHash = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: mewmewInput,
      });
      const mewmewFeedMew: FeedMew = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mew_with_context",
        payload: mewmewActionHash,
      });

      // Bob quotes Alice's mew
      const quoteInput: Mew = {
        text: "a response to a quoted mew",
        links: [],
        mew_type: { [MewTypeName.Quote]: actionHash },
      };
      const quoteActionHash: ActionHash = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: quoteInput,
      });
      const quoteFeedMew: FeedMew = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mew_with_context",
        payload: quoteActionHash,
      });

      await pause(1200);

      // Alice gets notifications
      const notifications = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_my_notifications",
        payload: null,
      });

      expect(notifications[0]).toMatchObject({
        agent: bob.agentPubKey,
        notification_type: { [NotificationTypeName.MyMewResponded]: null },
        feed_mew: quoteFeedMew,
      });
      expect(notifications[1]).toMatchObject({
        agent: bob.agentPubKey,
        notification_type: { [NotificationTypeName.MyMewResponded]: null },
        feed_mew: mewmewFeedMew,
      });
      expect(notifications[2]).toMatchObject({
        agent: bob.agentPubKey,
        notification_type: { [NotificationTypeName.MyMewResponded]: null },
        feed_mew: replyFeedMew,
      });
    },
    true,
    { timeout: 100000 }
  );
});

test("notifications include replies, quotes, mewmews to mews that I also responded to", async () => {
  await runScenario(
    async (scenario) => {
      // Set up the app to be installed
      const appSource = { appBundleSource: mewsfeedAppBundleSource };

      // Add 2 players with the test app to the Scenario. The returned players
      // can be destructured.
      const [alice, bob, carol] = await scenario.addPlayersWithApps([
        appSource,
        appSource,
        appSource,
      ]);

      // Shortcut peer discovery through gossip and register all agents in every
      // conductor of the scenario.
      await scenario.shareAllAgents();

      // Carol creates a Mew
      const actionHash: ActionHash = await createMew(carol.cells[0]);
      assert.ok(actionHash);

      await pause(1200);

      // Alice reply's to Carol's mew
      await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: {
          text: "test reply 12345",
          links: [],
          mew_type: { [MewTypeName.Reply]: actionHash },
        },
      });

      // Bob replies to Carol's mew
      const replyInput: Mew = {
        text: "test reply 12345",
        links: [],
        mew_type: { [MewTypeName.Reply]: actionHash },
      };
      const replyActionHash: ActionHash = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: replyInput,
      });
      const replyFeedMew: FeedMew = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mew_with_context",
        payload: replyActionHash,
      });

      // Bob mewmews Carol's mew
      const mewmewInput: Mew = {
        text: "",
        links: [],
        mew_type: { [MewTypeName.Mewmew]: actionHash },
      };
      const mewmewActionHash: ActionHash = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: mewmewInput,
      });
      const mewmewFeedMew: FeedMew = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mew_with_context",
        payload: mewmewActionHash,
      });

      // Bob quotes Carol's mew
      const quoteInput: Mew = {
        text: "a response to a quoted mew",
        links: [],
        mew_type: { [MewTypeName.Quote]: actionHash },
      };
      const quoteActionHash: ActionHash = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: quoteInput,
      });
      const quoteFeedMew: FeedMew = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mew_with_context",
        payload: quoteActionHash,
      });

      await pause(1200);

      // Alice gets notifications
      const notifications = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_my_notifications",
        payload: null,
      });

      expect(notifications[0]).toMatchObject({
        agent: bob.agentPubKey,
        notification_type: {
          [NotificationTypeName.FollowedYarnResponded]: null,
        },
        feed_mew: quoteFeedMew,
      });
      expect(notifications[1]).toMatchObject({
        agent: bob.agentPubKey,
        notification_type: {
          [NotificationTypeName.FollowedYarnResponded]: null,
        },
        feed_mew: mewmewFeedMew,
      });
      expect(notifications[2]).toMatchObject({
        agent: bob.agentPubKey,
        notification_type: {
          [NotificationTypeName.FollowedYarnResponded]: null,
        },
        feed_mew: replyFeedMew,
      });
    },
    true,
    { timeout: 100000 }
  );
});
