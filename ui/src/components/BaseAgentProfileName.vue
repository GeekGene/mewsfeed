<template>
  <div>
    <div v-if="profile" class="flex space-x-2">
      <div
        v-if="profile.fields[PROFILE_FIELDS.DISPLAY_NAME]"
        class="text-primary font-bold"
      >
        {{ profile.fields[PROFILE_FIELDS.DISPLAY_NAME] }}
      </div>
      <div class="font-mono">@{{ profile.nickname }}</div>
    </div>
    <div v-else class="font-mono">
      {{
        trimAgentPubKey
          ? `${encodeHashToBase64(agentPubKey).slice(0, 15)}...`
          : encodeHashToBase64(agentPubKey)
      }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ProfilesStore } from "@holochain-open-dev/profiles";
import { PROFILE_FIELDS } from "@/types/types";
import { AgentPubKey, encodeHashToBase64 } from "@holochain/client";
import { ComputedRef, computed, inject } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { useCellsReady } from "@/composables/useCellsReady";

const props = withDefaults(
  defineProps<{
    agentPubKey: AgentPubKey;
    trimAgentPubKey?: boolean;
  }>(),
  {
    trimAgentPubKey: true,
  }
);

const profilesStore = (inject("profilesStore") as ComputedRef<ProfilesStore>)
  .value;
const cellsReady = useCellsReady();
const agentPubKeyB64 = computed(() => encodeHashToBase64(props.agentPubKey));

const fetchProfile = async () => {
  const record = await profilesStore.client.getAgentProfile(
    props.agentPubKey,
    false
  );
  return record?.entry ?? null;
};

const { data: profile } = useQuery({
  queryKey: ["profiles", "getAgentProfile", agentPubKeyB64],
  queryFn: fetchProfile,
  enabled: cellsReady,
});
</script>

<style scoped></style>
