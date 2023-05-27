<template>
  <LinkProfilePopup :agent-pub-key="agentPubKey">
    <div class="row justify-end items-center">
      <div v-if="profile" class="row justify-center items-center">
        <agent-avatar
          :agentPubKey="agentPubKey"
          size="20"
          disable-tooltip
          disable-copy
          class="q-mr-xs"
        />
        <span class="q-mr-xs text-primary text-weight-bold">
          {{ profile.fields[PROFILE_FIELDS.DISPLAY_NAME] }}
        </span>
        <span>@{{ profile.nickname }}</span>
      </div>
      <span v-else>
        {{ encodeHashToBase64(agentPubKey).slice(0, 8) }}
      </span>
    </div>
  </LinkProfilePopup>
</template>

<script setup lang="ts">
import { Profile } from "@holochain-open-dev/profiles";
import { AgentPubKey, encodeHashToBase64 } from "@holochain/client";
import LinkProfilePopup from "@/components/LinkProfilePopup.vue";
import { PROFILE_FIELDS } from "@/types/types";

defineProps<{
  agentPubKey: AgentPubKey;
  profile?: Profile | null;
}>();
</script>

<style scoped></style>
