import { Record } from "@holochain/client";
import { fileURLToPath } from "url";
import path from "path";
import {
  AppBundle,
  AppBundleSource,
  CellProvisioningStrategy,
} from "@holochain/client";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import {
  FeedMew,
  FollowInput,
  RecommendedInput,
  Mew,
  MewTypeName,
} from "../../ui/src/types/types";

const createMewsFeedAppBundleSource = (
  properties: any = {}
): AppBundleSource => {
  return {
    bundle: {
      manifest: {
        manifest_version: "1",
        name: "mewsfeed",
        roles: [
          {
            name: "mewsfeed",
            provisioning: {
              strategy: CellProvisioningStrategy.Create,
              deferred: false,
            },
            dna: {
              path: path.join(
                __dirname,
                "../../dnas/mewsfeed/workdir/mewsfeed.dna"
              ),
              modifiers: {
                properties,
              },
            },
          },
        ],
      },
      resources: {},
    },
  };
};

export const mewsfeedAppBundleSource: AppBundleSource =
  createMewsFeedAppBundleSource({
    mew_characters_min: 5,
    mew_characters_max: 200,
    prefix_index_width: 3,
  });

export const mewsfeedAppBundleSourceNoLengthLimits: AppBundleSource =
  createMewsFeedAppBundleSource();

export const createAgents = async (scenario) => {
  // Set up the app to be installed
  const appSource = { appBundleSource: mewsfeedAppBundleSource };

  const playersWithApps = await scenario.addPlayersWithApps([
    appSource,
    appSource,
    appSource,
  ]);

  // Shortcut peer discovery through gossip and register all agents in every conductor of the scenario.
  await scenario.shareAllAgents();

  return playersWithApps.map((player) => {
    return {
      agentPubKey: player.agentPubKey,
      cells: player.cells, // so that legacy calls to cells[0] still work
      follow: (payload: FollowInput): Promise<null> =>
        player.cells[0].callZome({
          zome_name: "follows",
          fn_name: "follow",
          payload,
        }),
      // TODO merge this with mews/common.ts createMew function:
      createMew: (payload: Mew): Promise<Record> => {
        payload.mew_type = { [MewTypeName.Original]: null };
        return player.cells[0].callZome({
          zome_name: "mews",
          fn_name: "create_mew",
          payload,
        });
      },
      trustFeed: (payload: RecommendedInput): Promise<FeedMew[]> =>
        player.cells[0].callZome({
          zome_name: "mews",
          fn_name: "get_trusted_mews_with_context",
          payload,
        }),
    };
  });
};
