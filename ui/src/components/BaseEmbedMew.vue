<template>
  <div class="q-mx-sm q-my-sm">
    <MewContent :mew="embedMew.mew as Mew" class="cursor-pointer q-mb-sm" />
    <div class="row justify-end items-center">
      <div
        v-if="embedMew.author_profile"
        class="row justify-center items-center"
      >
        <agent-avatar
          :agentPubKey="embedMew.action.author"
          size="20"
          disable-tooltip
          disable-copy
          class="q-mr-xs"
        />
        <span class="q-mr-xs text-primary text-weight-bold">
          {{ embedMew.author_profile.fields[PROFILE_FIELDS.DISPLAY_NAME] }}
        </span>
        <span>@{{ embedMew.author_profile.nickname }}</span>
      </div>
      <span v-else>
        {{ encodeHashToBase64(embedMew.action.author).slice(0, 8) }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { EmbedMew } from "@/types/types";
import { encodeHashToBase64 } from "@holochain/client";
import { PROFILE_FIELDS, Mew } from "@/types/types";
import MewContent from "@/components/MewContent.vue";
import ProfileAvatarWithPopup from "./ProfileAvatarWithPopup.vue";

defineProps<{
  embedMew: EmbedMew;
}>();
</script>

<style scoped></style>
