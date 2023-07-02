<template>
  <template v-if="!agentProfiles || loading || true">
    <QList v-for="i of [0, 1, 2]" :key="i">
      <BaseAgentProfileListItemSkeleton />
    </QList>
  </template>

  <BaseEmptyList
    v-else-if="agentProfiles?.length === 0"
    :text="emptyText || 'No agents yet'"
  />

    <BaseList
      v-slot="{ item }"
      v-bind="$attrs"
      class="my-8"
      :items="agentProfiles"
      :is-loading="loading"
    >
      <BaseAgentProfilesListItem
        :agent-profile="item"
        :enable-popup="enablePopups"
      />
    </BaseList>
</template>

<script setup lang="ts">
import { AgentProfile } from "@/types/types";
import BaseAgentProfilesListItem from "@/components/BaseAgentProfilesListItem.vue";
import BaseEmptyList from "@/components/BaseEmptyList.vue";
import BaseAgentProfileListItemSkeleton from "@/components/BaseAgentProfileListItemSkeleton.vue";
import BaseList from "@/components/BaseList.vue";

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
