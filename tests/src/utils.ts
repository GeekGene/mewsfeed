import { fileURLToPath } from "url";
import path from "path";
import { AppBundleSource, CellProvisioningStrategy } from "@holochain/client";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const mewsfeedHapp: AppBundleSource = {
  // path: path.join(__dirname, "../../workdir/mewsfeed.happ"),
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
              properties: {
                mew_characters_min: 5,
                mew_characters_max: 200,
              },
            },
          },
        },
      ],
    },
    resources: {},
  },
};

export const mewsfeedHappNoLengthLimits: AppBundleSource = {
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
              properties: {},
            },
          },
        },
      ],
    },
    resources: {},
  },
};

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(() => resolve(null), ms));
