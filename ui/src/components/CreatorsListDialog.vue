<template>
  <BaseDialog
    :model-value="modelValue"
    @update:model-value="(val: boolean) => emit('update:model-value', val)"
  >
    <h2 class="text-3xl font-title font-bold tracking-tighter mb-8 text-left">
      following
    </h2>

    <BaseInfiniteScroll
      v-if="
        data && data.pages && data.pages.length > 0 && data.pages[0].length > 0
      "
      @load-next="fetchNextPageInfiniteScroll"
    >
      <BaseAgentProfileList
        v-for="(page, i) in data.pages"
        :key="i"
        :agent-profiles="page"
        :loading="isLoading"
        :enable-popups="false"
      />
    </BaseInfiniteScroll>
    <BaseAgentProfileListItemSkeleton
      v-for="x in [0, 1, 2, 3]"
      v-else-if="isLoading"
      :key="x"
    />
    <BaseEmptyList v-else />
  </BaseDialog>
</template>

<script setup lang="ts">
import { AppAgentClient } from "@holochain/client";
import { ComputedRef, inject } from "vue";
import { onBeforeRouteLeave } from "vue-router";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/vue-query";
import BaseAgentProfileListItemSkeleton from "@/components/BaseAgentProfileListItemSkeleton.vue";
import BaseEmptyList from "@/components/BaseEmptyList.vue";
import BaseAgentProfileList from "@/components/BaseAgentProfileList.vue";
import { watch } from "vue";
import { useToasts } from "@/stores/toasts";
import { ProfilesStore } from "@holochain-open-dev/profiles";
import { encodeHashToBase64 } from "@holochain/client";
import { AgentProfile } from "@/types/types";
import { AgentPubKey } from "@holochain/client";
import BaseInfiniteScroll from "@/components/BaseInfiniteScroll.vue";

const emit = defineEmits(["update:model-value"]);
const props = defineProps<{
  modelValue: boolean;
  agentPubKey: AgentPubKey;
}>();

const client = (inject("client") as ComputedRef<AppAgentClient>).value;
const profilesStore = (inject("profilesStore") as ComputedRef<ProfilesStore>)
  .value;
const queryClient = useQueryClient();
const { showError } = useToasts();

const pageLimit = 10;

const fetchCreators = async (params: any) => {
  const agents: AgentPubKey[] = await await client.callZome({
    role_name: "mewsfeed",
    zome_name: "follows",
    fn_name: "get_creators_for_follower",
    payload: {
      follower: props.agentPubKey,
      page: {
        limit: pageLimit,
        ...params.pageParam,
      },
    },
  });

  const agentProfiles = await Promise.all(
    agents.map(async (agentPubKey) => {
      const profile = await profilesStore.client.getAgentProfile(agentPubKey);
      if (!profile) return null;

      return {
        agentPubKey,
        profile: profile,
      };
    })
  );

  return agentProfiles.filter(Boolean) as AgentProfile[];
};

const { data, error, fetchNextPage, hasNextPage, isLoading } = useInfiniteQuery(
  {
    queryKey: [
      "mews",
      "get_creators_for_follower",
      encodeHashToBase64(props.agentPubKey),
    ],
    queryFn: fetchCreators,
    getNextPageParam: (lastPage) => {
      if (lastPage.length === 0) return;
      if (lastPage.length < pageLimit) return;

      return { after_agentpubkey: lastPage[lastPage.length - 1] };
    },
    refetchInterval: 1000 * 60 * 2, // 2 minutes
  }
);

const fetchProfile = async () => {
  const profile = await profilesStore.client.getAgentProfile(props.agentPubKey);

  if (profile) {
    return profile;
  } else {
    throw new Error("No profile found");
  }
};

const { data: profile, error: errorProfile } = useQuery({
  queryKey: [
    "profiles",
    "getAgentProfile",
    encodeHashToBase64(props.agentPubKey),
  ],
  queryFn: fetchProfile,
});

const fetchNextPageInfiniteScroll = async (
  done: (hasMore?: boolean) => void
) => {
  await fetchNextPage();
  done(hasNextPage?.value);
};

watch(error, showError);
watch(errorProfile, showError);

onBeforeRouteLeave(() => {
  if (data.value && data.value.pages.length > 1) {
    queryClient.setQueryData(
      [
        "mews",
        "get_creators_for_follower",
        encodeHashToBase64(props.agentPubKey),
      ],
      (d: any) => ({
        pages: [d.pages[0]],
        pageParams: [d.pageParams[0]],
      })
    );
  }
});
</script>