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
    :items="agentProfiles"
    :is-loading="loading"
  >
    <BaseAgentProfileListItem
      :agent-pub-key="item.agentPubKey"
      :profile="item.profile"
      :enable-popup="enablePopups"
      :trim-agent-pub-key="trimAgentPubKey"
      class="cursor-pointer py-3"
      @click="
        router.push({
          name: ROUTES.profile,
          params: {
            agentPubKey: encodeHashToBase64(item.agentPubKey),
          },
        })
      "
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
import { ROUTES } from "@/router";
import { useRouter } from "vue-router";
import { encodeHashToBase64 } from "@holochain/client";

withDefaults(
  defineProps<{
    agentProfiles?: AgentProfile[];
    loading: boolean;
    emptyText?: string;
    enablePopups?: boolean;
    trimAgentPubKey?: boolean;
  }>(),
  {
    agentProfiles: undefined,
    emptyText: undefined,
    enablePopups: true,
    trimAgentPubKey: true,
  }
);
const router = useRouter();
</script>
