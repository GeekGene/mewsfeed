<template>
  <BaseAgentProfileDetail
    :profile="profile"
    :agentPubKey="props.agentPubKey"
    :joined-timestamp="joinedTimestamp"
    :hide-edit-button="hideEditButton"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
import { AgentPubKey, AppClient } from "@holochain/client";
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
const client = (inject("client") as ComputedRef<AppClient>).value;
const agentPubKeyB64 = computed(() => encodeHashToBase64(props.agentPubKey));

const fetchProfile = async () => {
  const profile = await profilesStore.client.getAgentProfile(props.agentPubKey);
  if (profile) {
    return profile;
  } else {
    throw new Error("No profile found");
  }
};

const {
  data: profile,
  error: errorProfile,
  refetch: refetchProfile,
} = useQuery({
  queryKey: ["profiles", "getAgentProfile", agentPubKeyB64],
  queryFn: fetchProfile,
  refetchOnMount: true,
});
watch(errorProfile, console.error);

const fetchJoinedTimestamp = async () =>
  client.callZome({
    role_name: "mewsfeed",
    zome_name: "profiles",
    fn_name: "get_joining_timestamp_for_agent",
    payload: props.agentPubKey,
  });

const {
  data: joinedTimestamp,
  error: errorJoinedTimestamp,
  refetch: refetchJoinedTimestamp,
} = useQuery({
  queryKey: ["profiles", "get_joining_timestamp_for_agent", agentPubKeyB64],
  queryFn: fetchJoinedTimestamp,
  refetchOnMount: true,
});
watch(errorJoinedTimestamp, console.error);

watch(props, () => {
  refetchProfile();
  refetchJoinedTimestamp();
});
</script>
