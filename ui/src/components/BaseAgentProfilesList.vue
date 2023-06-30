<template>
  <template v-if="!agentProfiles || loading">
    <QList v-for="i of [0, 1, 2]" :key="i">
      <BaseProfileSkeleton />
    </QList>
  </template>

  <BaseEmptyList
    v-else-if="agentProfiles?.length === 0"
    :text="emptyText || 'No agents yet'"
  />

  <template v-else>
    <QList v-bind="$attrs">
      <BaseAgentProfilesListItem
        v-for="(agentProfile, index) of agentProfiles"
        :key="index"
        :agent-profile="agentProfile"
        :enable-popup="enablePopups"
      />
    </QList>
  </template>
</template>

<script setup lang="ts">
import { QList } from "quasar";
import { AgentProfile } from "@/types/types";
import BaseAgentProfilesListItem from "@/components/BaseAgentProfilesListItem.vue";
import BaseEmptyList from "./BaseEmptyList.vue";
import BaseProfileSkeleton from "./BaseProfileSkeleton.vue";

withDefaults(
  defineProps<{
    agentProfiles?: AgentProfile[];
    loading: boolean;
    emptyText?: string;
    enablePopups?: boolean;
  }>(),
  {
    agentProfiles: undefined,
    emptyText: undefined,
    enablePopups: true,
  }
);
</script>
