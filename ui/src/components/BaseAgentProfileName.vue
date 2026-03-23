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
import { PROFILE_FIELDS } from "@/types/types";
import { AgentPubKey, encodeHashToBase64 } from "@holochain/client";
import { computed } from "vue";
import { useProfile } from "@/composables/useProfile";

const props = withDefaults(
  defineProps<{
    agentPubKey: AgentPubKey;
    trimAgentPubKey?: boolean;
  }>(),
  {
    trimAgentPubKey: true,
  }
);

const { profile } = useProfile(computed(() => props.agentPubKey));
</script>

<style scoped></style>
