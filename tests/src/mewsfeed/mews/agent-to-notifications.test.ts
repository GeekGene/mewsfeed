import { ActionHash } from "@holochain/client";
import { dhtSync, runScenario } from "@holochain/tryorama";
import { assert, expect, it } from "vitest";
import {
  FeedMew,
  Mew,
  MewTypeName,
  NotificationType,
  PaginationDirectionName,
} from "../../../../ui/src/types/types";
import { mewsfeedAppBundleSource } from "../../common";
import { createMew } from "./common";

it("notifications include my agent follows & unfollows", async () => {
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

      await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

      // Alice gets notifications
      const notifications = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_my_notifications",
        payload: null,
      });

      // Notifications should be orderded by action time descending (newest first)
      expect(notifications[0]).toMatchObject({
        agent: bob.agentPubKey,
        notification_type: NotificationType.MyAgentUnfollowed
      });
      expect(notifications[1]).toMatchObject({
        agent: bob.agentPubKey,
        notification_type: NotificationType.MyAgentFollowed
      });

      // Alice gets notifications count
      const count = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "count_my_notifications",
        payload: null,
      });
      expect(count).toEqual(2);
    },
    true,
    { timeout: 500000 }
  );
});

it("notifications include my mews' likes & unlikes", async () => {
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

      await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

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

      await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

      // Alice gets notifications
      const notifications = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_my_notifications",
        payload: null,
      });

      expect(notifications[0]).toMatchObject({
        agent: bob.agentPubKey,
        notification_type: NotificationType.MyMewUnlicked,
        feed_mew: feedMew,
      });
      expect(notifications[1]).toMatchObject({
        agent: bob.agentPubKey,
        notification_type: NotificationType.MyMewLicked,
        feed_mew: feedMew,
      });

      // Alice gets notifications count
      const count = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "count_my_notifications",
        payload: null,
      });
      expect(count).toEqual(2);
    },
    true,
    { timeout: 500000 }
  );
});

it("notifications include my mews' pins & unpins", async () => {
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

      await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

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

      await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

      // Alice gets notifications
      const notifications = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_my_notifications",
        payload: null,
      });

      expect(notifications[0]).toMatchObject({
        agent: bob.agentPubKey,
        notification_type: NotificationType.MyMewUnpinned,
        feed_mew: feedMew,
      });
      expect(notifications[1]).toMatchObject({
        agent: bob.agentPubKey,
        notification_type: NotificationType.MyMewPinned,
        feed_mew: feedMew,
      });

      // Alice gets notifications count
      const count = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "count_my_notifications",
        payload: null,
      });
      expect(count).toEqual(2);
    },
    true,
    { timeout: 500000 }
  );
});

it("notifications include my mews' replies, quotes, mewmews", async () => {
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

      await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

      // Bob replies to Alice's mew
      const replyInput: Mew = {
        text: "test reply 12345",
        links: [],
        mew_type: { type: MewTypeName.Reply, original_action_hash: actionHash },
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
        mew_type: { type: MewTypeName.Mewmew, original_action_hash: actionHash },
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
        mew_type: { type: MewTypeName.Quote, original_action_hash: actionHash },
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

      await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

      // Alice gets notifications
      const notifications = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_my_notifications",
        payload: null,
      });

      expect(notifications[0]).toMatchObject({
        agent: bob.agentPubKey,
        notification_type: NotificationType.MyMewResponded,
        feed_mew: quoteFeedMew,
      });
      expect(notifications[1]).toMatchObject({
        agent: bob.agentPubKey,
        notification_type: NotificationType.MyMewResponded,
        feed_mew: mewmewFeedMew,
      });
      expect(notifications[2]).toMatchObject({
        agent: bob.agentPubKey,
        notification_type: NotificationType.MyMewResponded,
        feed_mew: replyFeedMew,
      });

      // Alice gets notifications count
      const count = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "count_my_notifications",
        payload: null,
      });
      expect(count).toEqual(3);
    },
    true,
    { timeout: 500000 }
  );
});

it("notifications include replies, quotes, mewmews to mews that I also responded to", async () => {
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

      await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

      // Alice reply's to Carol's mew
      await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: {
          text: "test reply 12345",
          links: [],
          mew_type: { type: MewTypeName.Reply, original_action_hash: actionHash },
        },
      });

      // Bob replies to Carol's mew
      const replyInput: Mew = {
        text: "test reply 12345",
        links: [],
        mew_type: { type: MewTypeName.Reply, original_action_hash: actionHash },
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
        mew_type: { type: MewTypeName.Mewmew, original_action_hash: actionHash },
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
        mew_type: { type: MewTypeName.Quote, original_action_hash: actionHash },
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

      await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

      // Alice gets notifications
      const notifications = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_my_notifications",
        payload: null,
      });

      expect(notifications[0]).toMatchObject({
        agent: bob.agentPubKey,
        notification_type: NotificationType.FollowedYarnResponded,
        feed_mew: quoteFeedMew,
      });
      expect(notifications[1]).toMatchObject({
        agent: bob.agentPubKey,
        notification_type: NotificationType.FollowedYarnResponded,
        feed_mew: mewmewFeedMew,
      });
      expect(notifications[2]).toMatchObject({
        agent: bob.agentPubKey,
        notification_type: NotificationType.FollowedYarnResponded,
        feed_mew: replyFeedMew,
      });

      // Alice gets notifications count
      const count = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "count_my_notifications",
        payload: null,
      });
      expect(count).toEqual(3);
    },
    true,
    { timeout: 500000 }
  );
});

it("notifications list is time-paginated", async () => {
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

      await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

      // Bob replies to Alice's mew
      const replyInput: Mew = {
        text: "xyxyxyxy test reply 1",
        links: [],
        mew_type: { type: MewTypeName.Reply, original_action_hash: actionHash },
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

      // Bob replies to Alice's mew
      const replyInput2: Mew = {
        text: "xyxyxyxy test reply 2",
        links: [],
        mew_type: { type: MewTypeName.Reply, original_action_hash: actionHash },
      };
      const replyActionHash2: ActionHash = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: replyInput2,
      });
      const replyFeedMew2: FeedMew = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mew_with_context",
        payload: replyActionHash2,
      });

      // Bob replies to Alice's mew
      const replyInput3: Mew = {
        text: "xyxyxyxy test reply 3",
        links: [],
        mew_type: { type: MewTypeName.Reply, original_action_hash: actionHash },
      };
      const replyActionHash3: ActionHash = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: replyInput3,
      });
      const replyFeedMew3: FeedMew = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mew_with_context",
        payload: replyActionHash3,
      });

      // Bob replies to Alice's mew
      const replyInput4: Mew = {
        text: "xyxyxyxy test reply 4",
        links: [],
        mew_type: { type: MewTypeName.Reply, original_action_hash: actionHash },
      };
      const replyActionHash4: ActionHash = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: replyInput4,
      });
      const replyFeedMew4: FeedMew = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mew_with_context",
        payload: replyActionHash4,
      });

      // Bob replies to Alice's mew
      const replyInput5: Mew = {
        text: "xyxyxyxy test reply 5",
        links: [],
        mew_type: { type: MewTypeName.Reply, original_action_hash: actionHash },
      };
      const replyActionHash5: ActionHash = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: replyInput5,
      });
      const replyFeedMew5: FeedMew = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mew_with_context",
        payload: replyActionHash5,
      });

      // Bob replies to Alice's mew
      const replyInput6: Mew = {
        text: "xyxyxyxy test reply 6",
        links: [],
        mew_type: { type: MewTypeName.Reply, original_action_hash: actionHash },
      };
      const replyActionHash6: ActionHash = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: replyInput6,
      });
      const replyFeedMew6: FeedMew = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mew_with_context",
        payload: replyActionHash6,
      });

      // Bob replies to Alice's mew
      const replyInput7: Mew = {
        text: "xyxyxyxy test reply 7",
        links: [],
        mew_type: { type: MewTypeName.Reply, original_action_hash: actionHash },
      };
      const replyActionHash7: ActionHash = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: replyInput7,
      });
      const replyFeedMew7: FeedMew = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mew_with_context",
        payload: replyActionHash7,
      });

      await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

      // Alice gets notifications
      const page1 = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_my_notifications",
        payload: {
          direction: { [PaginationDirectionName.Descending]: null },
          limit: 2,
        },
      });

      // Notifications should be orderded by action time descending (newest first)
      expect(page1[0]).toMatchObject({
        agent: bob.agentPubKey,
        notification_type: NotificationType.MyMewResponded,
        feed_mew: replyFeedMew7,
      });
      expect(page1[1]).toMatchObject({
        agent: bob.agentPubKey,
        notification_type: NotificationType.MyMewResponded,
        feed_mew: replyFeedMew6,
      });

      expect(page1[0].timestamp).greaterThanOrEqual(page1[1].timestamp);

      // Alice gets notifications
      const page2 = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_my_notifications",
        payload: {
          after_timestamp: page1[1].timestamp,
          direction: { [PaginationDirectionName.Descending]: null },
          limit: 2,
        },
      });

      // Notifications should be orderded by action time descending (newest first)
      expect(page2[0]).toMatchObject({
        agent: bob.agentPubKey,
        notification_type: NotificationType.MyMewResponded,
        feed_mew: replyFeedMew5,
      });
      expect(page2[1]).toMatchObject({
        agent: bob.agentPubKey,
        notification_type: NotificationType.MyMewResponded,
        feed_mew: replyFeedMew4,
      });

      expect(page1[0].timestamp)
        .greaterThanOrEqual(page1[1].timestamp)
        .greaterThanOrEqual(page2[0].timestamp)
        .greaterThanOrEqual(page2[1].timestamp);

      // Alice gets notifications
      const page3 = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_my_notifications",
        payload: {
          after_timestamp: page2[1].timestamp,
          direction: { [PaginationDirectionName.Descending]: null },
          limit: 2,
        },
      });

      // Notifications should be orderded by action time descending (newest first)
      expect(page3[0]).toMatchObject({
        agent: bob.agentPubKey,
        notification_type: NotificationType.MyMewResponded,
        feed_mew: replyFeedMew3,
      });
      expect(page3[1]).toMatchObject({
        agent: bob.agentPubKey,
        notification_type: NotificationType.MyMewResponded,
        feed_mew: replyFeedMew2,
      });

      expect(page1[0].timestamp)
        .greaterThanOrEqual(page1[1].timestamp)
        .greaterThanOrEqual(page2[0].timestamp)
        .greaterThanOrEqual(page2[1].timestamp)
        .greaterThanOrEqual(page3[0].timestamp)
        .greaterThanOrEqual(page3[1].timestamp);

      // Alice gets notifications
      const page4 = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_my_notifications",
        payload: {
          after_timestamp: page3[1].timestamp,
          direction: { [PaginationDirectionName.Descending]: null },
          limit: 2,
        },
      });

      // Notifications should be orderded by action time descending (newest first)
      assert.lengthOf(page4, 1);
      expect(page4[0]).toMatchObject({
        agent: bob.agentPubKey,
        notification_type: NotificationType.MyMewResponded,
        feed_mew: replyFeedMew,
      });

      expect(page1[0].timestamp)
        .greaterThanOrEqual(page1[1].timestamp)
        .greaterThanOrEqual(page2[0].timestamp)
        .greaterThanOrEqual(page2[1].timestamp)
        .greaterThanOrEqual(page3[0].timestamp)
        .greaterThanOrEqual(page3[1].timestamp)
        .greaterThanOrEqual(page4[0].timestamp);

      const page5 = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_my_notifications",
        payload: {
          after_timestamp: page4[0].timestamp,
          direction: { [PaginationDirectionName.Descending]: null },
          limit: 2,
        },
      });

      assert.lengthOf(page5, 0);
    },
    true,
    { timeout: 500000 }
  );
});
