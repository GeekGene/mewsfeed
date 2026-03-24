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
import { AgentPubKey, AppClient, encodeHashToBase64 } from "@holochain/client";
import { ComputedRef, computed, inject, watch } from "vue";
import { useCellsReady } from "@/composables/useCellsReady";
import BaseAgentProfileDetail from "@/components/BaseAgentProfileDetail.vue";
import { useQuery } from "@tanstack/vue-query";
import { wrapInput } from "@/utils/zomeCall";
import { useProfile } from "@/composables/useProfile";

const props = withDefaults(
  defineProps<{
    agentPubKey: AgentPubKey;
    hideEditButton?: boolean;
  }>(),
  {
    hideEditButton: false,
  }
);

const client = (inject("client") as ComputedRef<AppClient>).value;
const cellsReady = useCellsReady();
const agentPubKeyB64 = computed(() => encodeHashToBase64(props.agentPubKey));

const { profile } = useProfile(computed(() => props.agentPubKey));

const fetchJoinedTimestamp = async () =>
  client.callZome({
    role_name: "mewsfeed",
    zome_name: "profiles",
    fn_name: "get_joining_timestamp_for_agent",
    payload: wrapInput(props.agentPubKey),
  });

const {
  data: joinedTimestamp,
  error: errorJoinedTimestamp,
} = useQuery({
  queryKey: ["profiles", "get_joining_timestamp_for_agent", agentPubKeyB64],
  queryFn: fetchJoinedTimestamp,
  staleTime: Infinity,
  cacheTime: Infinity,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  enabled: cellsReady,
});
watch(errorJoinedTimestamp, console.error);
</script>
