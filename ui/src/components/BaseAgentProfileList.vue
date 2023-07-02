<template>
  <template v-if="!agentProfiles || loading">
    <BaseListSkeleton :count="3">
      <BaseAgentProfileListItemSkeleton />
    </BaseListSkeleton>
  </template>

  <BaseEmptyList
    v-else-if="agentProfiles?.length === 0"
    :text="emptyText || 'No agents yet'"
  />

  <BaseList
    v-else
    v-slot="{ item }"
    v-bind="$attrs"
    class="my-8"
    :items="agentProfiles"
    :is-loading="loading"
  >
    <BaseAgentProfileListItem
      :agent-profile="item"
      :enable-popup="enablePopups"
    />
  </BaseList>
</template>

<script setup lang="ts">
import { AgentProfile } from "@/types/types";
import BaseAgentProfileListItem from "@/components/BaseAgentProfileListItem.vue";
import BaseEmptyList from "@/components/BaseEmptyList.vue";
import BaseAgentProfileListItemSkeleton from "@/components/BaseAgentProfileListItemSkeleton.vue";
import BaseList from "@/components/BaseList.vue";
import BaseListSkeleton from "./BaseListSkeleton.vue";

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
