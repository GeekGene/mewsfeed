<template>
  <template v-if="!agentProfiles || loading">
    <QList v-for="i of [0, 1, 2]" :key="i">
      <ProfileSkeleton />
    </QList>
  </template>

  <EmptyMewsFeed
    v-else-if="agentProfiles?.length === 0"
    :text="emptyText || 'No agents yet'"
  />

  <template v-else>
    <QList>
      <QItem
        v-for="(agentProfile, index) of agentProfiles"
        :key="index"
        class="row justify-start items-center q-px-none"
      >
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
    </QList>
  </template>
</template>

<script setup lang="ts">
import { QList, QItem, QItemLabel } from "quasar";
import { PROFILE_FIELDS, AgentProfile } from "@/types/types";
import ProfileAvatarWithPopup from "./ProfileAvatarWithPopup.vue";
import EmptyMewsFeed from "./EmptyMewsFeed.vue";
import ProfileSkeleton from "./ProfileSkeleton.vue";

defineProps<{
  agentProfiles?: AgentProfile[];
  loading: boolean;
  emptyText?: string;
}>();
</script>
