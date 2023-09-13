<template>
  <div>
    <div v-if="profile" class="flex flex-col text-base-content">
      <div
        v-if="profile.fields[PROFILE_FIELDS.DISPLAY_NAME]"
        class="font-bold text-xl"
      >
        {{ profile.fields[PROFILE_FIELDS.DISPLAY_NAME] }}
      </div>
      <div class="font-mono text-sm">@{{ profile.nickname }}</div>
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
import { Profile } from "@holochain-open-dev/profiles";
import { PROFILE_FIELDS } from "@/types/types";
import { AgentPubKey, encodeHashToBase64 } from "@holochain/client";

withDefaults(
  defineProps<{
    profile?: Profile | null;
    agentPubKey: AgentPubKey;
    trimAgentPubKey?: boolean;
  }>(),
  {
    profile: null,
    trimAgentPubKey: true,
  }
);
</script>

<style scoped></style>
