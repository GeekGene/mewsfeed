<template>
  <QItem class="row justify-start items-center q-px-none">
    <ProfileAvatarWithPopup
      :agentPubKey="agentProfile.agentPubKey"
      class="q-mr-md"
      :size="30"
    />
    <QItemLabel>
      {{ agentProfile.profile.fields[PROFILE_FIELDS.DISPLAY_NAME] }}
    </QItemLabel>
    <QItemLabel caption> @{{ agentProfile.profile.nickname }}</QItemLabel>
  </QItem>
</template>

<script setup lang="ts">
import { QItem, QItemLabel } from "quasar";
import { PROFILE_FIELDS, AgentProfile } from "@/types/types";
import ProfileAvatarWithPopup from "./ProfileAvatarWithPopup.vue";

defineProps<{
  agentProfile: AgentProfile;
}>();
</script>
