<template>
  <div
    :style="{
      position: 'relative',
      height: `${size}px`,
      width: `${size}px`,
    }"
  >
    <sl-avatar
      v-if="profile?.fields?.avatar"
      v-bind:image.prop="profile.fields.avatar"
      :style="`--size: ${size}px;`"
    />
    <holo-identicon
      v-else
      v-bind:hash.prop="agentPubKey"
      v-bind:size.prop="size"
      disable-tooltip
      disable-copy
    />
  </div>
</template>

<script setup lang="ts">
import { AgentPubKey } from "@holochain/client";
import { Profile } from "@holochain-open-dev/profiles";

withDefaults(
  defineProps<{
    agentPubKey: AgentPubKey;
    profile?: Profile;
    size?: number;
  }>(),
  {
    size: 32,
    profile: undefined,
  }
);
</script>
