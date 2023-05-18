<template>
  <AgentProfilesList
    :fetch-fn="fetchAgentProfiles"
    :cache-key="`follows/get_followers_for_creator/${props.agentPubKey}`"
    empty-text="No followers yet"
  />
</template>

<script setup lang="ts">
import { AgentProfile } from "@/types/types";
import { AgentPubKey, AppAgentClient } from "@holochain/client";
import { ComputedRef, inject } from "vue";
import { ProfilesStore } from "@holochain-open-dev/profiles";
import AgentProfilesList from "./AgentProfilesList.vue";

const props = defineProps<{ agentPubKey: AgentPubKey }>();
const profilesStore = (inject("profilesStore") as ComputedRef<ProfilesStore>)
  .value;
const client = (inject("client") as ComputedRef<AppAgentClient>).value;

const fetchAgentProfiles = async () => {
  const agents: AgentPubKey[] = await await client.callZome({
    role_name: "mewsfeed",
    zome_name: "follows",
    fn_name: "get_followers_for_creator",
    payload: props.agentPubKey,
  });

  const agentProfiles = await Promise.all(
    agents.map(async (agentPubKey) => {
      const profile = await profilesStore.client.getAgentProfile(agentPubKey);
      if (!profile) return null;

      return {
        agentPubKey,
        profile: profile,
      };
    })
  );

  return agentProfiles.filter(Boolean) as AgentProfile[];
};
</script>
