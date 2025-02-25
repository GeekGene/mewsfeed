<template>
  <div class="w-full">
    <div class="flex justify-start items-center space-x-2 mb-8">
      <BaseButtonBack />

      <h1 class="flex justify-start items-center space-x-4">
        <div class="text-2xl font-title font-bold tracking-tighter">
          mews by
        </div>
        <BaseAgentProfileLinkName
          class="q-ml-md"
          :agentPubKey="decodeHashFromBase64(route.params.agentPubKey as string)"
          :profile="profile"
          :avatar-size="30"
          :enable-popup="false"
        />
      </h1>
    </div>

    <BaseInfiniteScroll
      v-if="
        data && data.pages && data.pages.length > 0 && data.pages[0].length > 0
      "
      @load-next="fetchNextPageInfiniteScroll"
    >
      <template v-for="(page, i) in data.pages" :key="i">
        <template v-for="(mew, j) of page" :key="j">
          <BaseMewListItem
            :feed-mew="mew"
            @mew-deleted="
              refetch({ refetchPage: (page, index) => index === i })
            "
            @mew-licked="refetch({ refetchPage: (page, index) => index === i })"
            @mew-pinned="refetch({ refetchPage: (page, index) => index === i })"
            @mew-unlicked="
              refetch({ refetchPage: (page, index) => index === i })
            "
            @mew-unpinned="
              refetch({ refetchPage: (page, index) => index === i })
            "
            @mewmew-created="
              refetch({ refetchPage: (page, index) => index === i })
            "
            @quote-created="
              refetch({ refetchPage: (page, index) => index === i })
            "
            @reply-created="
              refetch({ refetchPage: (page, index) => index === i })
            "
          />
          <hr v-if="j !== page.length - 1" class="border-base-300" />
        </template>
      </template>
    </BaseInfiniteScroll>

    <BaseListSkeleton v-else-if="isInitialLoading" :count="4">
      <BaseMewListItemSkeleton />
    </BaseListSkeleton>
    <BaseEmptyList v-else />
  </div>
</template>

<script setup lang="ts">
import { AppClient } from "@holochain/client";
import { ComputedRef, computed, inject } from "vue";
import { useRoute, onBeforeRouteLeave } from "vue-router";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/vue-query";
import BaseEmptyList from "@/components/BaseEmptyList.vue";
import BaseMewListItem from "@/components/BaseMewListItem.vue";
import BaseAgentProfileLinkName from "@/components/BaseAgentProfileLinkName.vue";
import { watch } from "vue";
import { ProfilesStore } from "@holochain-open-dev/profiles";
import { decodeHashFromBase64 } from "@holochain/client";
import BaseButtonBack from "@/components/BaseButtonBack.vue";
import BaseInfiniteScroll from "@/components/BaseInfiniteScroll.vue";
import BaseListSkeleton from "@/components/BaseListSkeleton.vue";
import BaseMewListItemSkeleton from "@/components/BaseMewListItemSkeleton.vue";

const route = useRoute();
const client = (inject("client") as ComputedRef<AppClient>).value;
const profilesStore = (inject("profilesStore") as ComputedRef<ProfilesStore>)
  .value;
const queryClient = useQueryClient();
const agentPubKeyB64 = computed(() => route.params.agentPubKey);
const agentPubKey = computed(() =>
  decodeHashFromBase64(route.params.agentPubKey as string)
);

const pageLimit = 10;

const fetchAuthoredMews = async (params: any) => {
  const res = await client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "get_agent_mews_with_context",
    payload: {
      agent: agentPubKey.value,
      page: {
        limit: pageLimit,
        ...params.pageParam,
      },
    },
  });
  return res;
};

const { data, error, fetchNextPage, hasNextPage, isInitialLoading, refetch } =
  useInfiniteQuery({
    queryKey: ["mews", "get_agent_mews_with_context", agentPubKeyB64],
    queryFn: fetchAuthoredMews,
    getNextPageParam: (lastPage) => {
      if (lastPage.length === 0) return;
      if (lastPage.length < pageLimit) return;

      return { after_hash: lastPage[lastPage.length - 1].action_hash };
    },
    refetchInterval: 1000 * 60 * 2, // 2 minutes
    refetchOnMount: true,
  });

const fetchProfile = async () => {
  const profile = await profilesStore.client.getAgentProfile(agentPubKey.value);

  if (profile?.entry) {
    return profile.entry;
  } else {
    throw new Error("No profile found");
  }
};

const { data: profile, error: errorProfile } = useQuery({
  queryKey: ["profiles", "getAgentProfile", agentPubKeyB64],
  queryFn: fetchProfile,
});

const fetchNextPageInfiniteScroll = async (
  done: (hasMore?: boolean) => void
) => {
  await fetchNextPage();
  done(hasNextPage?.value);
};

watch(error, console.error);
watch(errorProfile, console.error);

onBeforeRouteLeave(() => {
  if (data.value && data.value.pages.length > 1) {
    queryClient.setQueryData(
      ["mews", "get_agent_mews_with_context", agentPubKeyB64.value],
      (d: any) => ({
        pages: [d.pages[0]],
        pageParams: [d.pageParams[0]],
      })
    );
  }
});
</script>
