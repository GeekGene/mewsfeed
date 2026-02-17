/**
 * ZeroArcProfilesClient - ProfilesClient for zero-arc nodes (like Holochain Web Conductor)
 *
 * Zero-arc nodes don't have local data for other agents - they must always
 * fetch from the network. This client overrides the default `local: true`
 * behavior of ProfilesClient to always use `local: false` for reads.
 *
 * This is necessary because:
 * 1. ProfilesClient defaults `local` to `true` (GetStrategy::Local)
 * 2. ProfilesStore uses these defaults when fetching other agents' profiles
 * 3. Full-sync Holochain nodes have all DHT data locally, so this works
 * 4. Zero-arc nodes (browser extensions) only have their own source chain
 * 5. For zero-arc nodes, we MUST use network fetches for other agents' data
 */

import { ProfilesClient } from "@holochain-open-dev/profiles";
import { EntryRecord } from "@holochain-open-dev/utils";
import type { AgentPubKey, AppClient, RoleName } from "@holochain/client";
import type { Profile } from "@holochain-open-dev/profiles";

export class ZeroArcProfilesClient extends ProfilesClient {
  constructor(
    client: AppClient,
    roleName: RoleName,
    zomeName = "profiles"
  ) {
    super(client, roleName, zomeName);
  }

  /**
   * Get the profile for the given agent - ALWAYS uses network fetch
   *
   * Override: ignores `local` parameter, always fetches from network
   */
  async getAgentProfile(
    agentPubKey: AgentPubKey,
    _local?: boolean  // Ignored - always use network
  ): Promise<EntryRecord<Profile> | undefined> {
    // Always use local=false to force network fetch for zero-arc nodes
    return super.getAgentProfile(agentPubKey, false);
  }

  /**
   * Search profiles - ALWAYS uses network fetch
   *
   * Override: ignores `local` parameter, always fetches from network
   */
  async searchAgents(
    nicknameFilter: string,
    _local?: boolean  // Ignored - always use network
  ): Promise<AgentPubKey[]> {
    // Always use local=false to force network fetch for zero-arc nodes
    return super.searchAgents(nicknameFilter, false);
  }

  /**
   * Get all agents with profiles - ALWAYS uses network fetch
   *
   * Override: ignores `local` parameter, always fetches from network
   */
  async getAgentsWithProfile(
    _local?: boolean  // Ignored - always use network
  ): Promise<AgentPubKey[]> {
    // Always use local=false to force network fetch for zero-arc nodes
    return super.getAgentsWithProfile(false);
  }
}
