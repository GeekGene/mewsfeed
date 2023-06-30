<template>
  <BaseLinkProfilePopup :agentPubKey="agentPubKey" :enabled="enablePopup">
    <agent-avatar
      :agentPubKey="agentPubKey"
      disable-tooltip
      :size="size"
      class="self-start"
      :store="profilesStore"
    >
    </agent-avatar>
  </BaseLinkProfilePopup>
</template>

<script setup lang="ts">
import BaseLinkProfilePopup from "@/components/BaseLinkProfilePopup.vue";
import { ProfilesStore } from "@holochain-open-dev/profiles";
import { ComputedRef, inject } from "vue";

withDefaults(
  defineProps<{
    agentPubKey: Uint8Array;
    size?: number;
    enablePopup?: boolean;
  }>(),
  {
    size: 50,
    enablePopup: true,
  }
);

const profilesStore = (inject("profilesStore") as ComputedRef<ProfilesStore>)
  .value;
</script>
