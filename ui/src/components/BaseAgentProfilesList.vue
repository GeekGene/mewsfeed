<template>
  <template v-if="!agentProfiles || loading">
    <QList v-for="i of [0, 1, 2]" :key="i">
      <BaseProfileSkeleton />
    </QList>
  </template>

  <BaseEmptyMewsFeed
    v-else-if="agentProfiles?.length === 0"
    :text="emptyText || 'No agents yet'"
  />

  <template v-else>
    <QList v-bind="$attrs">
      <BaseAgentProfilesListItem
        v-for="(agentProfile, index) of agentProfiles"
        :key="index"
        :agent-profile="agentProfile"
      />
    </QList>
  </template>
</template>

<script setup lang="ts">
import { QList } from "quasar";
import { AgentProfile } from "@/types/types";
import BaseAgentProfilesListItem from "@/components/BaseAgentProfilesListItem.vue";
import BaseEmptyMewsFeed from "./BaseEmptyMewsFeed.vue";
import BaseProfileSkeleton from "./BaseProfileSkeleton.vue";

defineProps<{
  agentProfiles?: AgentProfile[];
  loading: boolean;
  emptyText?: string;
}>();
</script>
