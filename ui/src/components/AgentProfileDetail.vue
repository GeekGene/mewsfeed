<template>
  <BaseAgentProfileDetail
    v-if="profileWithContext"
    :profile="profileWithContext.profile"
    :agentPubKey="props.agentPubKey"
    :joined-timestamp="profileWithContext.joinedTimestamp"
    :hide-edit-button="hideEditButton"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
import { useToasts } from "@/stores/toasts";
import { AgentPubKey, AppAgentClient } from "@holochain/client";
import { ComputedRef, computed, inject, watch } from "vue";
import { ProfilesStore } from "@holochain-open-dev/profiles";
import BaseAgentProfileDetail from "@/components/BaseAgentProfileDetail.vue";
import { useQuery } from "@tanstack/vue-query";
import { encodeHashToBase64 } from "@holochain/client";

const props = withDefaults(
  defineProps<{
    agentPubKey: AgentPubKey;
    hideEditButton?: boolean;
  }>(),
  {
    hideEditButton: false,
  }
);

const profilesStore = (inject("profilesStore") as ComputedRef<ProfilesStore>)
  .value;
const client = (inject("client") as ComputedRef<AppAgentClient>).value;
const { showError } = useToasts();
const agentPubKeyB64 = computed(() => encodeHashToBase64(props.agentPubKey));

const fetchProfileWithContext = async () => {
  const profile = await profilesStore.client.getAgentProfile(props.agentPubKey);
  const joinedTimestamp = await client.callZome({
    role_name: "mewsfeed",
    zome_name: "profiles",
    fn_name: "get_joining_timestamp_for_agent",
    payload: props.agentPubKey,
  });

  if (profile) {
    return {
      profile,
      joinedTimestamp,
    };
  } else {
    throw new Error("No profile found");
  }
};

const {
  data: profileWithContext,
  error: errorProfile,
  refetch,
} = useQuery({
  queryKey: ["profiles", "getAgentProfile", agentPubKeyB64],
  queryFn: fetchProfileWithContext,
  refetchOnMount: true,
});
watch(errorProfile, showError);
watch(props, () => {
  refetch();
});
</script>
