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
          ? encodeHashToBase64(agentPubKey).slice(0, 15)
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
